# Mobile application

Expo Router foundation for iOS and Android.

```bash
pnpm --filter @vocabulary/mobile dev
pnpm --filter @vocabulary/mobile typecheck
pnpm --filter @vocabulary/mobile build
```

The shell is English, dark-first, safe-area aware, and reports connectivity accessibly. Offline
status is infrastructure only; synchronization and lesson storage are later tasks. The project uses
Expo prebuild-on-demand, so generated `ios/` and `android/` directories are not committed.
