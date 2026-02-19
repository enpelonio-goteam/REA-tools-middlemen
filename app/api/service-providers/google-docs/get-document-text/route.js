import { NextResponse } from "next/server";

function readStructuralElements(elements) {
  let text = "";
  if (!Array.isArray(elements)) return text;

  for (const value of elements) {
    // Handle regular paragraph text.
    if (value?.paragraph?.elements) {
      for (const elem of value.paragraph.elements) {
        if (elem?.textRun?.content) {
          text += elem.textRun.content;
        }
      }
      text += "\n";
      continue;
    }

    // Handle tables by walking rows/cells recursively.
    if (value?.table?.tableRows) {
      for (const row of value.table.tableRows) {
        const cellTexts = [];
        for (const cell of row.tableCells ?? []) {
          const cellText = readStructuralElements(cell.content).trim();
          cellTexts.push(cellText);
        }
        text += `${cellTexts.join(" | ")}\n`;
      }
      continue;
    }

    // Handle table of contents blocks recursively.
    if (value?.tableOfContents?.content) {
      text += readStructuralElements(value.tableOfContents.content);
    }
  }

  return text;
}

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

  const documentId = payload?.documentId;

  if (typeof documentId !== "string" || documentId.length === 0) {
    return NextResponse.json(
      { error: "Invalid 'documentId'. It must be a non-empty string." },
      { status: 400 },
    );
  }

  const googleApiUrl = `https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}`;

  const googleResponse = await fetch(googleApiUrl, {
    method: "GET",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
    },
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

  const fullText = readStructuralElements(responseData?.body?.content);

  return NextResponse.json(
    {
      success: true,
      document_title: responseData?.title ?? "",
      text_content: fullText.trim(),
    },
    { status: 200 },
  );
}
