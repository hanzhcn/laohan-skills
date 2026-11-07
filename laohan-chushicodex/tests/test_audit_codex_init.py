"""Run the real collector with local CLI stubs; never change HOME/CODEX_HOME."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest


ENTRY = Path(__file__).resolve().parents[1] / 'scripts/audit-codex-init.sh'


class AuditCollectorTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.config = self.root / 'config inventory'
        self.config.mkdir()
        self.bin = self.root / 'bin'
        self.bin.mkdir()
        self.calls = self.root / 'calls'
        stub = self.bin / 'codex'
        stub.write_text('''#!/bin/sh
printf '%s\\n' "$*" >> "$AUDIT_FIXTURE_CALLS"
if [ "$1" = '--version' ]; then
  printf 'codex fixture-version\\n'
  exit 0
fi
case "$AUDIT_FIXTURE_MODE" in
  doctor-failed) printf 'fixture doctor failed\\n' >&2; exit 42 ;;
  unsupported) printf 'unsupported strict parameter\\n' >&2; exit 2 ;;
esac
printf '{"fixture":"redacted doctor report"}\\n'
''')
        stub.chmod(0o700)
        self.env = dict(os.environ, PATH=str(self.bin) + ':/usr/bin:/bin',
                        AUDIT_FIXTURE_CALLS=str(self.calls), AUDIT_FIXTURE_MODE='healthy')

    def run_audit(self, mode='healthy', *args):
        env = dict(self.env, AUDIT_FIXTURE_MODE=mode)
        return subprocess.run(['bash', str(ENTRY), '--config-root', str(self.config), *args],
                              cwd=str(self.root), env=env, text=True, capture_output=True,
                              timeout=20)

    def test_success_runs_strict_doctor_and_redacts_configuration_values(self):
        (self.config / 'config.toml').write_text(
            'approval_policy = "never" # fixture-comment-secret\n'
            'sandbox_mode = "workspace-write"\n'
            'api_key = "fixture-key-secret"\n'
            '[projects."fixture-project-secret"]\n')
        result = self.run_audit()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn('--strict-config doctor --json', self.calls.read_text())
        self.assertIn('approval_policy = <configured', result.stdout)
        self.assertIn('collection complete', result.stdout)
        for secret in ['fixture-comment-secret', 'fixture-key-secret', 'fixture-project-secret']:
            self.assertNotIn(secret, result.stdout + result.stderr)

    def test_doctor_failure_is_nonzero_and_recovery_passes(self):
        result = self.run_audit('doctor-failed')
        self.assertEqual(result.returncode, 1)
        self.assertIn('exit=42', result.stderr)
        self.assertIn('Audit incomplete', result.stderr)
        self.assertNotIn('collection complete', result.stdout)
        self.assertEqual(self.run_audit().returncode, 0)

    def test_unsupported_strict_command_cannot_pass(self):
        result = self.run_audit('unsupported')
        self.assertEqual(result.returncode, 1)
        self.assertIn('exit=2', result.stderr)
        self.assertNotIn('collection complete', result.stdout)

    def test_missing_cli_cannot_pass(self):
        (self.bin / 'codex').unlink()
        result = self.run_audit()
        self.assertEqual(result.returncode, 1)
        self.assertIn('exit=127', result.stderr)
        self.assertNotIn('collection complete', result.stdout)

    def test_invalid_arguments_fail_before_any_command(self):
        result = subprocess.run(['bash', str(ENTRY), '--config-root', 'relative'],
                                cwd=str(self.root), env=self.env, text=True, capture_output=True)
        self.assertEqual(result.returncode, 2)
        self.assertFalse(self.calls.exists())


if __name__ == '__main__':
    unittest.main()
