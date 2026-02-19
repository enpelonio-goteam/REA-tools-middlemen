# REA Tools Middlemen

Next.js API middlemen for third-party providers.

## Google Docs append endpoint

- **Route:** `POST /api/service-providers/google-docs/append-text`
- **Headers:** `Authorization: Bearer <google_oauth_access_token>`
- **Body (JSON):**

```json
{
  "documentId": "your_google_doc_id",
  "text": "\nHello from middlemen API"
}
```

This endpoint forwards your bearer token and calls Google Docs `documents.batchUpdate` with an `insertText` request to append at the end of the document body.

## Run locally

```bash
npm install
npm run dev
```
