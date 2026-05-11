export async function downloadCsv(url: string, fallbackFilename: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Export failed");
  }

  const blob = await response.blob();

  const disposition = response.headers.get("Content-Disposition");
  const filenameMatch = disposition?.match(/filename="(.+)"/);
  const filename = filenameMatch?.[1] || fallbackFilename;

  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(objectUrl);
}
