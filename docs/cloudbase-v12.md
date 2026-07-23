# CloudBase V12 deployment

The V12 container serves both the React application and FastAPI under `/pandahug`.

## Serverless MySQL

Create a Serverless MySQL database in the same Tencent Cloud region as the existing CloudBase environment. Enable the CloudBase service's private network and use the database's private endpoint.

Create a database with `utf8mb4` encoding. The application creates its tables on first startup.

Set these CloudBase environment variables:

```text
DATABASE_URL=mysql+pymysql://USER:PASSWORD@PRIVATE_HOST:3306/DATABASE?charset=utf8mb4
JWT_SECRET=<at least 32 random characters>
JWT_EXPIRE_HOURS=168
AUTH_COOKIE_SECURE=true
OPENAI_API_KEY=<configured key>
OPENAI_BASE_URL=<configured endpoint>
LLM_MODEL=<configured model>
LLM_FAST_MODEL=<configured fast model>
HUME_API_KEY=<optional>
HUME_SECRET_KEY=<optional>
HUME_CONFIG_ID=<optional>
```

Percent-encode special characters in the database username or password before placing them in `DATABASE_URL`.

## Deploy

Build the repository root with `Dockerfile`. Keep the existing CloudBase service name to preserve its public URL. The application must run with one Uvicorn worker per container; CloudBase can scale containers because all user state is stored in MySQL.

After deployment, verify:

```text
GET  /pandahug/
POST /pandahug/api/auth/register
POST /pandahug/api/auth/login
GET  /pandahug/api/auth/me
```

The authentication cookie is HttpOnly and Secure in CloudBase. Do not put `DATABASE_URL` or `JWT_SECRET` in source control.

## Legacy import

Before switching production traffic, run the import command once in an environment that can access both the legacy data directory and MySQL:

```text
python3 backend-v12/scripts/migrate_legacy_data.py --username admin
```

The command prompts for the initial password and is safe to run again.
