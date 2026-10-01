import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  page,
  currentPage: propCurrentPage,
  limit,
  pageSize,
  total,
  totalItems,
  onPageChange,
  onLimitChange,
  onPageSizeChange,
  limitOptions,
  pageSizeOptions
}) {
  const activeLimit = Math.min(100, Math.max(1, limit ?? pageSize ?? 5));
  const activeTotal = total ?? totalItems ?? 0;
  const rawPage = page ?? propCurrentPage ?? 1;
  const totalPages = Math.max(1, Math.ceil(activeTotal / activeLimit));
  const currentPage = Math.min(Math.max(1, rawPage), totalPages);
  const options = limitOptions || pageSizeOptions || [5, 10, 25, 50];

  const startRecord = activeTotal === 0 ? 0 : (currentPage - 1) * activeLimit + 1;
  const endRecord = Math.min(currentPage * activeLimit, activeTotal);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push("...");
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push("...");
      }
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const handlePageClick = (p) => {
    if (p === "..." || p === currentPage || p < 1 || p > totalPages) return;
    if (onPageChange) onPageChange(p);
  };

  const handleLimitSelect = (e) => {
    const newLimit = Math.min(100, Math.max(1, parseInt(e.target.value, 10) || 5));
    if (onLimitChange) onLimitChange(newLimit);
    if (onPageSizeChange) onPageSizeChange(newLimit);
    if (onPageChange) onPageChange(1);
  };

  const hasLimitChange = Boolean(onLimitChange || onPageSizeChange);

  return (
    <div
      className="pw-pagination-container"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        padding: "14px 18px",
        marginTop: "16px",
        background: "var(--bg-card, #ffffff)",
        borderRadius: "10px",
        border: "1px solid var(--border-color, #e2e8f0)",
        fontSize: "0.85rem",
        color: "var(--text-secondary, #64748b)",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        minWidth: 0
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", minWidth: 0 }}>
        <span>
          {activeTotal === 0 ? (
            "No records to display"
          ) : (
            <>
              Showing <strong style={{ color: "var(--text-primary, #0f172a)" }}>{startRecord}</strong>–
              <strong style={{ color: "var(--text-primary, #0f172a)" }}>{endRecord}</strong> of{" "}
              <strong style={{ color: "var(--text-primary, #0f172a)" }}>{activeTotal}</strong> records
            </>
          )}
        </span>

        {hasLimitChange && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label htmlFor="pw-page-size-select" style={{ fontSize: "0.8rem" }}>
              Per page:
            </label>
            <select
              id="pw-page-size-select"
              value={activeLimit}
              onChange={handleLimitSelect}
              style={{
                padding: "4px 8px",
                borderRadius: "6px",
                border: "1px solid var(--border-color, #cbd5e1)",
                background: "var(--bg-card, #ffffff)",
                color: "var(--text-primary, #0f172a)",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                outline: "none"
              }}
            >
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", justifyContent: "center", minWidth: 0, maxWidth: "100%" }}>
        <button
          type="button"
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage <= 1}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid var(--border-color, #cbd5e1)",
            background: currentPage <= 1 ? "var(--bg-sub, #f8fafc)" : "var(--bg-card, #ffffff)",
            color: currentPage <= 1 ? "var(--text-muted, #94a3b8)" : "var(--text-primary, #0f172a)",
            cursor: currentPage <= 1 ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: "0.8rem",
            transition: "all 0.15s ease"
          }}
          aria-label="Previous Page"
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap", justifyContent: "center", minWidth: 0 }}>
          {getPageNumbers().map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  style={{
                    padding: "4px 8px",
                    color: "var(--text-muted, #94a3b8)",
                    userSelect: "none"
                  }}
                >
                  ...
                </span>
              );
            }
            const isActive = p === currentPage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => handlePageClick(p)}
                style={{
                  minWidth: "32px",
                  height: "32px",
                  padding: "0 6px",
                  borderRadius: "6px",
                  border: isActive ? "1px solid #0d9488" : "1px solid var(--border-color, #cbd5e1)",
                  background: isActive ? "#0d9488" : "var(--bg-card, #ffffff)",
                  color: isActive ? "#ffffff" : "var(--text-primary, #0f172a)",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease"
                }}
                aria-current={isActive ? "page" : undefined}
                aria-label={`Page ${p}`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage >= totalPages}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid var(--border-color, #cbd5e1)",
            background: currentPage >= totalPages ? "var(--bg-sub, #f8fafc)" : "var(--bg-card, #ffffff)",
            color: currentPage >= totalPages ? "var(--text-muted, #94a3b8)" : "var(--text-primary, #0f172a)",
            cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: "0.8rem",
            transition: "all 0.15s ease"
          }}
          aria-label="Next Page"
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
