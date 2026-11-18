# Verify Kafka delivery and retries

Use a disposable local broker to check the parts an in-memory subscription test cannot cover. This walkthrough sends one valid inventory event, then a bad record, and inspects what the adapter committed. It uses the worker and options from [Consume inventory events from Kafka](/message/kafka).

## 1. Create two local topics

With Docker installed and port 9092 available, start the single-node broker used in CHO's Kafka integration tests. Bind it to the local interface.

```sh
docker run -d --rm --name cho-docs-kafka -p 127.0.0.1:9092:9092 apache/kafka:4.1.0
```

Wait for Kafka to finish startup. From a POSIX shell, run:

```sh
for topic in books.received books.received.failed; do
  docker exec cho-docs-kafka /opt/kafka/bin/kafka-topics.sh \
    --bootstrap-server localhost:9092 --create --if-not-exists \
    --topic "$topic" --partitions 1 --replication-factor 1
done
```

Each topic has one partition so the offset changes below are easy to follow. Start `worker.ts` using the [command for your runtime](/message/kafka#start-the-consumer) and leave it running.

## 2. Publish a valid and an invalid shipment

```sh
printf '%s\n' '{"isbn":"9780140268867"}' '{"isbn":17}' | \
  docker exec -i cho-docs-kafka /opt/kafka/bin/kafka-console-producer.sh \
    --bootstrap-server localhost:9092 --topic books.received
```

The worker prints the valid ISBN. The second record fails its input check. With `retries: 2` it gets an initial attempt and two retries. Read the dead letter:

```sh
docker exec cho-docs-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 --topic books.received.failed \
  --from-beginning --max-messages 1 --property print.headers=true
```

Expect the original `{"isbn":17}` payload and diagnostic headers including `cho-topic:books.received`, `cho-group:inventory` and `cho-attempts:3`. The adapter commits the source record after dead-letter publication succeeds.

## 3. Inspect the group's progress

```sh
docker exec cho-docs-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 --describe --group inventory
```

For a fresh topic containing just these two records, wait for `CURRENT-OFFSET` to reach `2` and `LAG` to reach `0`. Stop the worker with Ctrl+C, then start it again with the same group. A new valid record should be handled once it arrives. The two earlier records already have committed offsets.

If the dead-letter consumer waits indefinitely, check the worker's broker address, group membership and selected `@Catch` policy. A handler that settles an error with `true` or a fallback reply bypasses the adapter's retries and dead-letter publication. Enable `CHO_DEBUGLOG=cho:message,cho:kafka` before starting the worker to inspect that distinction.

Stop the worker and run `docker stop cho-docs-kafka` to discard the local broker and its temporary data.

## Check the adapter on your runtime

From the CHO checkout with dependencies installed, run `tools/brokers.sh start kafka` on a machine with Docker and port 9092 free. Choose one command below to exercise the real-broker tests, including committed offsets, retries, partition ordering and consumer group rebalancing. Setting `KAFKA_BROKERS` enables the integration suite.

::: code-group

```sh [Node.js]
KAFKA_BROKERS=localhost:9092 npx tsx --test vendor/kafka/kafka_test.ts
```

```sh [Deno]
KAFKA_BROKERS=localhost:9092 deno test --allow-read --allow-net --allow-env vendor/kafka/kafka_test.ts
```

```sh [Bun]
KAFKA_BROKERS=localhost:9092 bun test --timeout 120000 vendor/kafka/kafka_test.ts
```

:::

Run `docker stop cho-kafka` to remove the test broker started by the helper. To save CI time, the project runs the Kafka integration suite against a real broker on Node.js only. The same suite runs locally on all three server runtimes. CI runs the broker-independent Kafka tests and the real NATS/JetStream suite on Node.js, Deno and Bun. Cloudflare Workers has its own [workerd test job](/guide/cloudflare-workers#what-runs-in-workerd).
