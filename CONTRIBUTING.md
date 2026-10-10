# Contributing to S3-MinIO Storage System

Thank you for your interest in contributing to the S3-MinIO Storage System! We welcome all contributions from bug fixes to performance enhancements and new features.

---

## 🛠️ Development Setup

### Prerequisites
- **Node.js**: >= 18.x (Node 20+ recommended)
- **npm**: >= 9.x
- **Docker & Docker Compose**: For running MinIO locally

### Step-by-Step Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/eayushsingh/s3Bucket.git
   cd s3Bucket
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env.local
   ```

4. **Start MinIO Engine & Development Server**
   ```bash
   # Starts MinIO containers (if not running) and launches Next.js dev server
   npm run dev
   ```

5. **Run Tests**
   ```bash
   npm test
   ```

---

## 🧪 Testing Guidelines

We use [Vitest](https://vitest.dev/) for unit and integration testing.

- Ensure all existing tests pass: `npm test`
- Add unit tests for any new sanitization logic, storage operations, or helper utilities.
- Place tests in the `tests/` directory mirroring the source structure.

---

## 📐 Code Style & Conventions

- **TypeScript**: Strict type checking is enabled. Avoid `any` types wherever possible.
- **Components**: Write modular, accessible React components in `components/`.
- **API Routes**: Follow the Next.js App Router route conventions in `app/api/`. Return standard API responses using `ApiResponse` helpers in `lib/api-response.ts`.
- **Storage Layer**: Maintain clean abstractions in `storage/` using AWS SDK v3 commands.

---

## 🔀 Pull Request Workflow

1. Create a descriptive feature branch:
   ```bash
   git checkout -b feat/my-new-feature
   ```
2. Commit your changes using conventional commits:
   - `feat(...)`: A new feature
   - `fix(...)`: A bug fix
   - `docs(...)`: Documentation changes
   - `test(...)`: Adding or updating tests
   - `refactor(...)`: Code refactoring without behavioral changes
   - `chore(...)`: Maintenance and dependency updates
3. Push to your fork:
   ```bash
   git push origin feat/my-new-feature
   ```
4. Open a Pull Request on GitHub against the `main` branch.

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
