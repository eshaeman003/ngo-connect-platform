import { jsPDF } from "jspdf";

/**
 * Generates a formal, downloadable PDF letter for a legal notice or warning
 * notification, complete with letterhead, reference number, the original
 * complaint/finding details, and a signature + official stamp block.
 *
 * @param {object} notification - { title, message, type, created_at }
 * @param {object} ngo - { name, email, phone, address, location }
 */
export function generateNoticePDF(notification, ngo) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 56;
  let y = 60;

  const isLegal = (notification.type || "").includes("legal");
  const accent = isLegal ? [178, 34, 34] : [184, 121, 42]; // deep red / amber

  // ── Letterhead ──
  doc.setFillColor(27, 67, 50); // deep green
  doc.rect(0, 0, pageWidth, 6, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(27, 67, 50);
  doc.text("NGO CONNECT", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  y += 16;
  doc.text("Trust & Safety / Platform Compliance Team", margin, y);
  doc.text("compliance@ngoconnect.org  ·  www.ngoconnect.org", pageWidth - margin, y, { align: "right" });

  y += 14;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);

  // ── Title block ──
  y += 34;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text(isLegal ? "FORMAL LEGAL NOTICE" : "OFFICIAL WARNING LETTER", margin, y);

  // Parse reference number out of the message body if present
  const refMatch = (notification.message || "").match(/Reference Number:\s*(\S+)/i);
  const refNumber = refMatch ? refMatch[1] : `${isLegal ? "LN" : "WL"}-${new Date(notification.created_at || Date.now()).getFullYear()}-${String(Date.now()).slice(-5)}`;
  const issueDate = notification.created_at ? new Date(notification.created_at) : new Date();

  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Reference No: ${refNumber}`, margin, y);
  doc.text(`Date Issued: ${issueDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, pageWidth - margin, y, { align: "right" });

  // ── Recipient ──
  y += 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text("TO:", margin, y);
  doc.setFont("helvetica", "normal");
  y += 14;
  doc.text(ngo?.name || "Registered NGO", margin, y);
  y += 13;
  if (ngo?.address || ngo?.location) { doc.text(String(ngo.address || ngo.location), margin, y); y += 13; }
  if (ngo?.email) { doc.text(ngo.email, margin, y); y += 13; }
  if (ngo?.phone) { doc.text(ngo.phone, margin, y); y += 13; }

  // ── Subject ──
  y += 14;
  doc.setFont("helvetica", "bold");
  doc.text(`Subject: ${notification.title || "Platform Compliance Notice"}`, margin, y);

  // ── Body ──
  y += 26;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(30, 30, 30);
  const bodyLines = doc.splitTextToSize(notification.message || "No additional details were provided.", pageWidth - margin * 2);
  bodyLines.forEach((line) => {
    if (y > 700) { doc.addPage(); y = 60; }
    doc.text(line, margin, y);
    y += 15;
  });

  // ── Signature + stamp block ──
  y = Math.max(y + 50, 620);
  if (y > 700) { doc.addPage(); y = 620; }

  doc.setDrawColor(150, 150, 150);
  doc.line(margin, y, margin + 180, y);
  y += 14;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(15);
  doc.setTextColor(27, 67, 50);
  doc.text("A. Rahman", margin, y);
  y += 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.text("Compliance Officer, NGO Connect Trust & Safety", margin, y);
  y += 12;
  doc.text("Digitally issued — no physical signature required for validity", margin, y);

  // Circular vector "official stamp"
  const stampX = pageWidth - margin - 65;
  const stampY = y - 55;
  doc.setDrawColor(accent[0], accent[1], accent[2]);
  doc.setLineWidth(1.4);
  doc.circle(stampX, stampY, 42, "S");
  doc.circle(stampX, stampY, 36, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text("NGO CONNECT", stampX, stampY - 6, { align: "center" });
  doc.text(isLegal ? "OFFICIAL NOTICE" : "OFFICIAL WARNING", stampX, stampY + 4, { align: "center" });
  doc.setFontSize(6.5);
  doc.text(issueDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }), stampX, stampY + 14, { align: "center" });

  // ── Footer ──
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "This is a system-generated compliance document issued by NGO Connect. For queries, contact compliance@ngoconnect.org.",
    pageWidth / 2, 812, { align: "center" }
  );

  const filename = `${isLegal ? "Legal-Notice" : "Warning-Letter"}-${refNumber}.pdf`;
  doc.save(filename);
}
