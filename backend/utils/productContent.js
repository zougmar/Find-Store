const { isValidSlug, slugify } = require('./slug');

function cleanLines(values, { maxItems, maxLength }) {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .slice(0, maxItems)
    .map((value) => value.slice(0, maxLength));
}

function sanitizeProductBody(body = {}) {
  const data = { ...body };

  delete data.benefitsText;
  delete data.specificationsText;
  delete data.faqsText;
  delete data._id;
  delete data.ratings;
  delete data.averageRating;
  delete data.numReviews;
  delete data.createdAt;
  delete data.updatedAt;

  if (typeof data.name === 'string') data.name = data.name.trim().slice(0, 160);
  if (typeof data.description === 'string') data.description = data.description.trim().slice(0, 8000);
  if (typeof data.category === 'string') data.category = data.category.trim().slice(0, 80);
  if (typeof data.subcategory === 'string') data.subcategory = data.subcategory.trim().slice(0, 80);
  if (typeof data.headline === 'string') data.headline = data.headline.trim().slice(0, 180);
  if (typeof data.deliveryNote === 'string') data.deliveryNote = data.deliveryNote.trim().slice(0, 500);
  if (typeof data.supportNote === 'string') data.supportNote = data.supportNote.trim().slice(0, 500);

  if (data.slug != null && String(data.slug).trim() !== '') {
    const normalized = slugify(data.slug);
    if (!isValidSlug(normalized)) {
      const error = new Error('Slug may only contain lowercase letters, numbers, and hyphens');
      error.status = 400;
      throw error;
    }
    data.slug = normalized;
  } else {
    delete data.slug;
  }

  if (data.features != null) {
    data.features = cleanLines(data.features, { maxItems: 20, maxLength: 240 });
  }
  if (data.benefits != null) {
    data.benefits = cleanLines(data.benefits, { maxItems: 12, maxLength: 200 });
  }
  if (data.images != null && Array.isArray(data.images)) {
    data.images = data.images
      .map((image) => String(image || '').trim())
      .filter(Boolean)
      .slice(0, 12);
  }

  if (data.specifications != null) {
    data.specifications = (Array.isArray(data.specifications) ? data.specifications : [])
      .map((item) => ({
        label: String(item?.label || '').trim().slice(0, 80),
        value: String(item?.value || '').trim().slice(0, 180)
      }))
      .filter((item) => item.label && item.value)
      .slice(0, 20);
  }

  if (data.faqs != null) {
    data.faqs = (Array.isArray(data.faqs) ? data.faqs : [])
      .map((item) => ({
        question: String(item?.question || '').trim().slice(0, 180),
        answer: String(item?.answer || '').trim().slice(0, 600)
      }))
      .filter((item) => item.question && item.answer)
      .slice(0, 12);
  }

  return data;
}

module.exports = { sanitizeProductBody };
