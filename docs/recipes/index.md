# HTTP recipes

Each recipe adds one behavior to a controller or entry point from the [HTTP quick start](/web/quick-start). Import the decorators and context types used in a controller fragment from `@chojs/web`. The paths in the verification commands assume no controller route or application prefix. If you keep the tutorial's `api` prefix, add `/api` to those URLs.

| I need to… | Start here | Verify with |
| --- | --- | --- |
| Deliver records while producing them | [Stream a response](/recipes/streaming) | `curl -N` |
| Offer a file with a suggested name | [Download a file](/recipes/downloads) | Response headers and downloaded bytes |
| Receive a multipart form | [Accept an upload](/recipes/uploads) | `curl -F` |
| Expose a fixed upstream service through a route | [Forward a request](/recipes/proxy) | Upstream status and body |
| Drain connections before disposing resources | [Shut down gracefully](/recipes/shutdown) | A request active during shutdown |

For browser subscriptions with named events and automatic reconnection, use the [SSE guide](/web/sse).
