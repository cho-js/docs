# Create a workspace with the CHO CLI

Use `cho new` to create a workspace and its first application. Choose **web** for an HTTP service or **cli** for a command-line application. For a message consumer or a Cloudflare Worker, start with the [consumer guide](/message/quick-start) or the [Worker entry point](/guide/cloudflare-workers).

## Create and start a web project

Install the `cho` executable with the runtime you use for development. Choose one command.

```sh
# Deno
deno install --global --allow-env --allow-read --allow-write --allow-run --name cho jsr:@chojs/cli
# Node.js
npm install --global @chojs/cli
# Bun
bun add --global @chojs/cli
```

From the parent directory of your new workspace, run `cho new library`. Select **web**, choose your runtime, and accept the project and folder defaults. The generator writes the application under `library/apps/api`. In that directory, start the server with the command for your runtime.

| Deno | Node.js | Bun |
| --- | --- | --- |
| `deno task start` | `npm run start` | `bun run start` |

Open `http://localhost:3000/` to reach the generated controller. Edit the handler in `app.ts` to change the JSON response. The separate `main.ts` creates the application and starts its listener. For a CLI starter, select **cli** instead. Its default project directory is `apps/cli` and its first command is `hello`.

## Choose all settings on the command line

For example, this creates a Bun command-line project in `library-tools/tools/catalog` and skips installation and Git initialization.

```sh
cho new library-tools --kind cli --runtime bun --apps-dir tools --project catalog --no-install --no-git --yes
```

| Argument or flag | Meaning | Default |
| --- | --- | --- |
| `[name]` | New workspace folder | Asked interactively |
| `--kind` | First project template, `web` or `cli` | `web` |
| `--runtime` | Workspace runtime, `deno`, `node` or `bun` | Runtime hosting the CLI |
| `--project` | First project name | `api` for web, `cli` for commands |
| `--apps-dir` | Directory containing the projects | `apps` |
| `--no-git` | Skip Git initialization | Initialize when outside an existing repository |
| `--no-install` | Skip dependency installation | Install dependencies |
| `--yes`, `-y` | Accept defaults for unanswered questions | Ask for missing answers |

Names start with a lowercase letter and contain lowercase letters, digits or hyphens. Choose a new folder name, even if an existing folder is empty. For unattended use, pass a workspace name and `--yes`. Ctrl+C during a question exits with status 130 before writing files. If installation or Git initialization fails later, the CLI keeps the generated workspace, exits with status 1 and prints the command to retry.

Use `cho help new` to see the options and `cho --version` to identify the installed executable.

## Read the workspace manifest

At the workspace root, `cho.json` records the runtime, the projects directory and the location of each application. Project paths in `root` are relative to the workspace. The entry and module paths are relative to that project.

```json
{
  "$schema": "https://chojs.io/schema/cho.v1.json",
  "version": 1,
  "runtime": "node",
  "appsDir": "apps",
  "projects": {
    "api": { "kind": "web", "root": "apps/api", "entry": "main.ts", "module": "app.ts" }
  }
}
```

Editors can use the [workspace schema](/schema/cho.v1.json) for completion and validation. To add a route or a command to the generated application, follow the [HTTP guide](/web/quick-start) or the [command guide](/command/quick-start).
