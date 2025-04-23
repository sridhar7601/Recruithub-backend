# RecruitHub

✨ Welcome to the RecruitHub workspace! ✨

---

## Quick Links

| Resource         | Link                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Figma Design** | [RecruitHub Design](https://www.figma.com/design/xeBQqVWlWMMvLGArwl13hM/RecruitHub?node-id=0-1&p=f)                |
| **Confluence**   | [RecruitHub Documentation](https://codaglobal.atlassian.net/wiki/spaces/RecruitHub/overview?homepageId=6461653402) |

---

## Workspace Structure

The workspace is organized into two main directories: `apps` and `libs`.

### `apps/`

This directory contains all the applications in the workspace, such as:

- **Frontend apps** (e.g., React, or other frameworks)
- **Backend apps** (e.g., NestJS APIs or others)

Each application should reside in its own directory under `apps/`.

---

## `libs/`

This directory contains reusable libraries and modules. It is further divided into the following subdirectories:

- **`libs/interfaces/`**  
  Contains common interfaces shared across the workspace. These interfaces should be used to ensure consistency between applications and libraries.

- **`libs/nest-modules/`**  
  A domain-based directory where all NestJS modules should be placed. Nest modules should not reside in the `apps/` directory. Instead, they should be created and maintained here.

- **`libs/utils/`**  
  Contains utility functions and classes that can be reused across the workspace.

### Guidelines

- Follow the `libs/` and `apps/` structure strictly to maintain consistency.
- For creating new nest libraries, use the following command:
  ```sh
  yarn nx g @nx/nest:lib libs/nest-modules<module-name>
  ```
  For other types of libraries, refer to the [Nx documentation](https://nx.dev).

---

## Run Tasks

To run the dev server for your app, use:

```sh
yarn nx serve <app-name>
```

To create a production bundle:

```sh
yarn nx build <app-name>
```

To see all available targets to run for a project, run:

```sh
yarn nx show project <app-name>
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

---

## Add New Projects

While you could add new projects to your workspace manually, you can leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

## CI / CD

TODO

## Testing

### Unit Tests

To run unit tests for a specific project:

```sh
yarn nx test <project-name>
```

To run tests with code coverage:

```sh
yarn nx test <project-name> --coverage
```

To run tests in watch mode (useful during development):

```sh
yarn nx test <project-name> --watch
```

To run a specific test file:

```sh
yarn nx test <project-name> --testFile=path/to/test/file.spec.ts
```

### E2E Tests

To run end-to-end tests for a specific project:

```sh
yarn nx e2e <project-name>
```

### Test All Projects

To run tests for all projects:

```sh
yarn nx run-many --target=test --all
```

To run tests with code coverage for all projects:

```sh
yarn nx run-many --target=test --all --coverage
```

### Debugging Tests

For debugging tests, you can use the following command which will run tests with the Node.js inspector enabled:

```sh
yarn nx test <project-name> --runInBand --detectOpenHandles
```

Then you can attach a debugger to the Node.js process.
