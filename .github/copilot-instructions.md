# GitHub Copilot Instructions

## Package Manager

Always use **bun** as the package manager. Do not use npm, yarn, or pnpm.

- Install dependencies: `bun install`
- Add a dependency: `bun add <package>`
- Add a dev dependency: `bun add -d <package>`
- Run scripts: `bun run <script>`

## Commit Format

Always use the **Conventional Commits** format for commit messages:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Changes that do not affect the meaning of the code (formatting, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `test`: Adding or updating tests
- `chore`: Changes to the build process or auxiliary tools
- `perf`: A code change that improves performance
- `ci`: Changes to CI configuration files and scripts
- `build`: Changes that affect the build system or external dependencies
- `revert`: Reverts a previous commit

### Examples

```
feat(auth): add login page
fix(api): handle null response from endpoint
docs(readme): update installation instructions
chore: bump dependencies
```
