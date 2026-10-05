export function exportToCsv(filename, headers, rows) {
  let resolvedHeaders = headers;
  let resolvedRows = rows;

  if (Array.isArray(headers) && headers.length > 0 && typeof headers[0] === "object" && !Array.isArray(headers[0]) && (!rows || !Array.isArray(rows))) {
    resolvedHeaders = Object.keys(headers[0]);
    resolvedRows = headers.map((item) => resolvedHeaders.map((key) => item[key]));
  }

  const csvRows = [];
  if (Array.isArray(resolvedHeaders) && resolvedHeaders.length > 0) {
    csvRows.push(resolvedHeaders.map((h) => `"${String(h ?? "").replace(/"/g, '""')}"`).join(","));
  }
  if (Array.isArray(resolvedRows)) {
    resolvedRows.forEach((row) => {
      if (Array.isArray(row)) {
        csvRows.push(row.map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`).join(","));
      }
    });
  }
  const csvContent = "\uFEFF" + csvRows.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const safeName = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.setAttribute("download", safeName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
