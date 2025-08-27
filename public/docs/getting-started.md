# Getting Started

## Installation

```
deno add jsr:@chojs/core jsr:@chojs/web jsr:@chojs/vendor
```

## Decorators & Extensions

Most of the time, you will never need to apply more than one decorator to the
same class or method. Extensions done by passing options to the decorators. We
provide a large collection of extension functions that can be used to extend the
decorators' functionality.

```ts

@Decorator(
  ExtensionA(...),
  ExtensionB(...),
  ExtensionC(...),
)
class SomeClass {
}


```

An example for extending a decorator is using the `Route` extension function to
add a route prefix to a decorated controller.

```ts
//\\ txt|12.5|2|controller extended with route prefix
@Controller(Route("api"))
class MyController {
}
```

Using the extension functions hide the underlying implementation and data
structure, letting you focus on the application logic.

## Endpoints

Endpoint is a method decorated with `@Get`, `@Post`, etc. in a class decorated
with `@Controller`. The controller (also known as "gateway" or "router") is
responsible to route the request to the correct endpoint.

```ts

@Controller()

class MyController {
  //\\ txt|8|5|GET /hello endpoint
  @Get("hello")
  hello() {
    return "Hello, World!";
  }
}
```

## Controller Route

The controller decorator can be extended to add a prefix to all endpoints in the
controller.

```ts
//// pop|none|7|1.2|"api" will be the prefix for all endpoints in this controller
@Controller(Route("api"))
class MyController {
  @Get("hello")
  hello() {
    return "Hello, World!";
  }
}

//// pop|none|12|-7.5|GET /api/hello
```

## Features

Features are modules containing a set of controllers. Like any module, it is an
injectable class but decorated with `@Feature`. Any module extension function can be
used to extend the feature.

Since feature is a module, it can provide dependencies.

```ts
//// pop|none|8|2.5|attaching controllers to a feature
@Feature(
  Controllers([MyController]),
)
class MyFeature {
}
```
