import {
  add_to_metadata_object, type ChoMethodDecorator, Controller,
  decorated_method, Injector, Module,
} from "@chojs/core/di";

const JOB = Symbol.for("library.jobs.name");

function Job(name: string): ChoMethodDecorator {
  if (!name.trim()) throw new Error("A job needs a name");
  return (target, context, descriptor) => {
    const method = decorated_method("@Job()", target, context, descriptor);
    if (method.static || method.private || typeof method.name !== "string") {
      throw new Error("@Job() requires a public instance method");
    }
    add_to_metadata_object(method.meta, { [JOB]: name });
  };
}

@Controller()
class CatalogJobs {
  @Job("refresh")
  refresh() { console.log("Catalog refreshed"); }
}

@Module({ controllers: [CatalogJobs] })
class Library {}

const injector = new Injector(Library);
try {
  const jobs = new Map<string, () => Promise<void>>();
  for (const node of injector.controllers()) {
    for (const method of node.meta.methods) {
      const job = method.meta[JOB];
      if (typeof job !== "string") continue;
      if (jobs.has(job)) throw new Error("Duplicate job: " + job);
      jobs.set(job, async () => {
        const instance = await injector.resolve(node.token, node.owner);
        await instance[method.name]();
      });
    }
  }

  const refresh = jobs.get("refresh");
  if (!refresh) throw new Error("Missing refresh job");
  await refresh();
} finally {
  await injector.dispose();
}
