function slugify(text) {
  const base = String(text || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);

  return base || 'product';
}

function isValidSlug(value) {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 80;
}

async function generateUniqueSlug(Model, source, excludeId) {
  const base = isValidSlug(source) ? source : slugify(source);
  let candidate = base;
  let i = 2;

  while (await Model.exists({ slug: candidate, _id: { $ne: excludeId } })) {
    candidate = `${base}-${i++}`;
    if (i > 100) {
      candidate = `${base}-${Date.now().toString(36)}`;
      break;
    }
  }

  return candidate;
}

module.exports = {
  slugify,
  isValidSlug,
  generateUniqueSlug
};
