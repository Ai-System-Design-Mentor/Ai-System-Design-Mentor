# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| Latest (`main`) | ✅ |
| Older branches | ❌ |

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

If you discover a security issue (e.g. JWT bypass, credential exposure, injection vulnerability), please report it responsibly:

1. **Email:** Send details to the maintainer's email listed in the repository profile
2. **Include:**
   - A clear description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if you have one)

You can expect an acknowledgement within **48 hours** and a resolution or status update within **7 days**.

## Known Security Considerations for Self-Hosters

If you are self-hosting this project, please ensure:

- **Never commit `.env` files** — both `backend/.env` and `frontend/.env.local` are in `.gitignore`
- **Rotate all credentials** before deploying — the example values in `.env.example` are placeholders only
- **Use a strong `JWT_SECRET`** — minimum 32 random bytes (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- **Set `NODE_ENV=production`** in your deployment environment
- **Use Gmail App Passwords**, not your main Gmail password, for `EMAIL_PASS`
- **Restrict `CLIENT_URL`** in `backend/.env` to your actual frontend domain in production

## What This Project Does for Security

- Helmet.js with Content Security Policy on all responses
- Rate limiting: 300 req/15min globally, 20 req/15min on auth, 30 msg/min per user on AI chat
- Passwords hashed with bcrypt (12 rounds)
- JWT tokens expire after 7 days; protected routes verify on every request
- OTP codes expire and are rate-limited to prevent brute force
- AI chat messages capped at 600 characters
- Diagram data validated (minimum 2 components) before AI evaluation
