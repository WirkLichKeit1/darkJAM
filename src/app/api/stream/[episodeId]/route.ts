import { cookies } from "next/headers";
import { NextRequest } from "next/server";

/**
 * Route Handler — proxy de streaming de vídeo
 *
 * Por que isso existe?
 * O VideoPlayer precisa enviar o JWT para o backend ao buscar vídeos.
 * Se fizéssemos isso client-side (como antes com Blob URL), o token
 * ficaria exposto no JavaScript do browser.
 *
 * Este handler roda server-side: lê o cookie httpOnly, injeta o
 * Authorization header, e faz proxy do stream para o cliente —
 * incluindo suporte completo a Range requests (seek no player).
 *
 * O frontend aponta o <video src> para /api/stream/[episodeId],
 * que é este arquivo. O backend nunca é acessado diretamente pelo browser.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ episodeId: string }> }
) {
  const { episodeId } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  // Sem token → não autorizado
  if (!token) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Repassa o Range header para suporte a seek
  const range = request.headers.get("range");

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    ...(range && { Range: range }),
  };

  const backendUrl = `${process.env.API_URL}/api/videos/stream/${episodeId}`;

  let backendResponse: Response;
  try {
    backendResponse = await fetch(backendUrl, { headers });
  } catch {
    return new Response(JSON.stringify({ message: "Backend unreachable" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Repassa os headers relevantes para o cliente (necessários para o player HTML5)
  const responseHeaders = new Headers();
  const headersToForward = [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
  ];
  headersToForward.forEach((h) => {
    const value = backendResponse.headers.get(h);
    if (value) responseHeaders.set(h, value);
  });

  // Faz streaming do body diretamente — não carrega tudo em memória
  return new Response(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}