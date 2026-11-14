# Modules

A module groups providers and controllers, and decides what the rest of the
application can see of them.

```ts
@Module({
  imports: [DbModule], //            modules whose exports this module can inject
  providers: [UserStore], //         @Injectable classes and provider objects
  controllers: [UsersController], // @Controller classes
  exports: [UserStore], //           tokens importers can inject
  dependencies: [Config], //         the module class's own constructor arguments
})
class UsersModule {}
```

Every option defaults to `[]`. `@chojs/web` adds one more, `route`
([Routing](/web/routing)). Any other option is rejected, by the types and when
the class is defined, so a typo (`provider` for `providers`) cannot pass
silently.

The **root module** is the one given to `ChoWeb.create` or `ChoCommand.create`.

## Scope rules

These decide which tokens a module can inject.

**A module sees what it declares, plus what its direct imports export.** What
an import does not export stays private to it.

```ts
@Module({ providers: [DbConn], exports: [DbConn] })
class Db {}

@Module({ imports: [Db], providers: [UserStore], exports: [UserStore] })
class Users {} // UserStore can inject DbConn

@Module({ imports: [Users], providers: [Api] })
class App {} // Api can inject UserStore, but not DbConn: Users does not export it
```

**Imports are not transitive.** An import's own imports are visible only if it
re-exports their tokens:

```ts
@Module({ imports: [Db], providers: [UserStore], exports: [UserStore, DbConn] })
class Users {} // re-exports DbConn: App can now inject it
```

Export tokens, not modules: exporting a whole imported module is not
supported.

**A module never sees the providers of the modules that import it.**

**Dependencies resolve where the provider is declared**, never in an importer's
scope. Overriding a token in an importer does not change what an imported
provider receives.

**A local declaration shadows an imported one.** A token a module declares
wins over the same token exported by an import. This is how a module replaces
an imported provider for itself.

**Two imports that export different instances of a token make it ambiguous.**
Injecting or exporting it is an error; declaring the token in the module
itself settles it. Two imports that re-export the *same* instance are not
ambiguous.

## Instances are per declaration

- The same class declared in the `providers` of **two** modules is two
  declarations, so two instances.
- A module imported through several paths is **one** module, with one set of
  instances.

To share one instance, declare it in one module, export it, and import that
module wherever it is needed:

```ts
@Module({ providers: [Logger], exports: [Logger] })
class LoggingModule {}

@Module({ imports: [LoggingModule], providers: [UserStore] })
class UsersModule {}

@Module({ imports: [LoggingModule], providers: [OrderStore] })
class OrdersModule {} // the same Logger instance as UsersModule
```

## Controllers

A controller is an entry point the framework calls: a class with route
handlers (`@chojs/web`) or commands (`@chojs/command`). It is declared in
`controllers`, not in `providers`.

```ts
@Controller({ dependencies: [UserStore] })
class UsersController {
  constructor(readonly store: UserStore) {}
}

@Module({ providers: [UserStore], controllers: [UsersController] })
class UsersModule {}
```

Its dependencies resolve in the scope of the module that declares it. Declare
a controller in one module only.

## A module is injectable itself

A module class is created with its `dependencies`, resolved in its own scope.
It can depend on its own providers and run setup code in its constructor:

```ts
@Module({ providers: [Migrations], dependencies: [Migrations] })
class DbModule {
  constructor(migrations: Migrations) {
    migrations.check();
  }
}
```

## Modules are not configured

A module takes no parameters, and never sees the providers of its importers,
so an importer cannot pass it configuration. There is no `forRoot()`.

What needs configuration is a value, and a value is created by a provider. A
reusable package therefore ships **classes**, and the application declares the
providers that construct them with its own configuration:

```ts
// a library: a class, no module
export class HttpClient {
  constructor(readonly url: string) {}
}

// the application: one provider per configured client
const USERS = token<HttpClient>("USERS");
const BILLING = token<HttpClient>("BILLING");

@Module({
  providers: [
    Config,
    provider({
      provide: USERS,
      deps: [Config],
      factory: (config) => new HttpClient(config.usersUrl),
    }),
    provider({
      provide: BILLING,
      deps: [Config],
      factory: (config) => new HttpClient(config.billingUrl),
    }),
  ],
  exports: [USERS, BILLING],
})
class ClientsModule {}
```

## Organizing an application

A layout that works for both kinds of application:

```
src/
  app.ts            the root module: imports the feature modules
  config.ts         Config and the tokens of configured values
  users/
    users.module.ts
    users.controller.ts
    user-store.ts
  orders/
    …
  main.ts           the only file that serves or reads the command line
```

```ts
// app.ts
@Module({ imports: [UsersModule, OrdersModule] })
export class App {}
```

In a web application, every module that declares controllers is a *feature*,
mounted at the root whatever imports it: importing a module does not nest its
routes. See [Routing](/web/routing).
