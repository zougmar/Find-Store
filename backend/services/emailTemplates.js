function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function layout(title, rows, actionUrl) {
  const body = rows.map(([label, value]) => `
    <tr>
      <td style="padding:8px 12px;color:#6b7280;width:140px;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:8px 12px;color:#111827;font-weight:600;">${value}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
  <html>
    <body style="margin:0;background:#f5f6fa;font-family:Arial,sans-serif;">
      <div style="max-width:640px;margin:24px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:#111827;color:#ffffff;padding:20px 24px;">
          <div style="font-size:13px;letter-spacing:0.12em;">FINDSTORE</div>
          <h1 style="margin:8px 0 0;font-size:22px;">${escapeHtml(title)}</h1>
        </div>
        <table style="width:100%;border-collapse:collapse;">${body}</table>
        ${actionUrl ? `<div style="padding:20px 24px;"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#FF385C;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">Open in dashboard</a></div>` : ''}
      </div>
    </body>
  </html>`;
}

function adminUrl(path) {
  const base = (process.env.FRONTEND_URL || 'https://find-store-phi.vercel.app').replace(/\/$/, '');
  return `${base}${path}`;
}

function orderEmail(order) {
  const details = order.paymentDetails || {};
  const address = order.shippingAddress || {};
  const items = (order.items || []).map((item) => {
    const name = item.product?.name || 'Product';
    return `${escapeHtml(name)} × ${escapeHtml(item.quantity)} — ${escapeHtml(item.price)} MAD`;
  }).join('<br>') || '—';

  const url = adminUrl('/admin/orders');
  return {
    subject: `FINDSTORE — New order ${String(order._id).slice(-8).toUpperCase()}`,
    html: layout('New customer order', [
      ['Reference', escapeHtml(order._id)],
      ['Customer', escapeHtml(details.customerName || order.user?.name || 'Guest')],
      ['Phone', escapeHtml(details.customerPhone || order.user?.phone || '—')],
      ['City', escapeHtml(details.city || address.city || '—')],
      ['Address', escapeHtml(details.address || address.street || '—')],
      ['Products', items],
      ['Total', `${escapeHtml(order.totalAmount)} MAD`],
      ['Status', escapeHtml(order.orderStatus || 'new')]
    ], url)
  };
}

function messageEmail(message) {
  const url = adminUrl('/admin/messages');
  return {
    subject: `FINDSTORE — New message from ${message.name}`,
    html: layout('New customer message', [
      ['Name', escapeHtml(message.name)],
      ['Email', escapeHtml(message.email)],
      ['Subject', escapeHtml(message.subject)],
      ['Message', escapeHtml(message.message).replace(/\n/g, '<br>')]
    ], url)
  };
}

module.exports = { orderEmail, messageEmail, adminUrl };
