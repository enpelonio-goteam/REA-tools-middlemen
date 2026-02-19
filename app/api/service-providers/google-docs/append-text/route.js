import { NextResponse } from "next/server";

export async function POST(request) {
  const authorization = request.headers.get("authorization");

  if (!authorization || !authorization.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json(
      {
        error:
          "Missing or invalid Authorization header. Use Bearer token from Google OAuth.",
      },
      { status: 401 },
    );
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const text = payload?.text;
  const documentId = payload?.documentId;

  if (typeof text !== "string" || text.length === 0) {
    return NextResponse.json(
      { error: "Invalid 'text'. It must be a non-empty string." },
      { status: 400 },
    );
  }

  if (typeof documentId !== "string" || documentId.length === 0) {
    return NextResponse.json(
      { error: "Invalid 'documentId'. It must be a non-empty string." },
      { status: 400 },
    );
  }

  const googleApiUrl = `https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}:batchUpdate`;

  const googleResponse = await fetch(googleApiUrl, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            endOfSegmentLocation: {},
            text,
          },
        },
      ],
    }),
  });

  const responseText = await googleResponse.text();
  let responseData;
  try {
    responseData = JSON.parse(responseText);
  } catch {
    responseData = { raw: responseText };
  }

  if (!googleResponse.ok) {
    return NextResponse.json(
      {
        error: "Google Docs API request failed.",
        googleStatus: googleResponse.status,
        googleResponse: responseData,
      },
      { status: googleResponse.status },
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: "Text appended to Google Document.",
      googleResponse: responseData,
    },
    { status: 200 },
  );
}
