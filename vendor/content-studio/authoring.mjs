// content-studio/src/authoring-core.mjs
import { createHash as createHash2 } from "node:crypto";

// content-studio/src/content-package-v2.mjs
import { createHash } from "node:crypto";

// content-studio/schemas/content-package.v2.schema.json
var content_package_v2_schema_default = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://local.niche-core.invalid/content-package.v2.schema.json",
  title: "Approved content package v2 (lossless editorial snapshots)",
  type: "object",
  additionalProperties: false,
  required: [
    "schemaVersion",
    "siteId",
    "canonicalHost",
    "locale",
    "site",
    "pages",
    "generatedAt"
  ],
  properties: {
    schemaVersion: {
      const: 2
    },
    siteId: {
      type: "string",
      pattern: "^[a-z0-9][a-z0-9-]{1,62}$"
    },
    canonicalHost: {
      type: "string",
      minLength: 4
    },
    locale: {
      type: "string",
      minLength: 2
    },
    generatedAt: {
      type: "string",
      format: "date-time"
    },
    site: {
      type: "object",
      additionalProperties: false,
      required: [
        "id",
        "name",
        "canonicalHost",
        "locale",
        "timezone",
        "brand",
        "offer",
        "contact",
        "renderer",
        "operatorName"
      ],
      properties: {
        id: {
          type: "string"
        },
        name: {
          type: "string"
        },
        canonicalHost: {
          type: "string"
        },
        locale: {
          type: "string"
        },
        timezone: {
          type: "string"
        },
        brand: {
          type: "object",
          additionalProperties: false,
          required: [
            "accent"
          ],
          properties: {
            accent: {
              type: "string"
            }
          }
        },
        offer: {
          type: "string"
        },
        contact: {
          type: "object",
          additionalProperties: false,
          required: [
            "email"
          ],
          properties: {
            email: {
              type: "string",
              format: "email"
            },
            phone: {
              type: "string"
            }
          }
        },
        renderer: {
          enum: [
            "gift",
            "niche"
          ]
        },
        operatorName: {
          type: "string",
          minLength: 1,
          maxLength: 300
        }
      }
    },
    pages: {
      type: "array",
      items: {
        $ref: "#/$defs/page"
      },
      minItems: 1,
      maxItems: 2e3
    }
  },
  $defs: {
    block: {
      oneOf: [
        {
          type: "object",
          additionalProperties: false,
          required: [
            "type",
            "text"
          ],
          properties: {
            type: {
              const: "paragraph"
            },
            text: {
              type: "string"
            }
          }
        },
        {
          type: "object",
          additionalProperties: false,
          required: [
            "type",
            "level",
            "text"
          ],
          properties: {
            type: {
              const: "heading"
            },
            level: {
              enum: [
                2,
                3
              ]
            },
            text: {
              type: "string"
            }
          }
        },
        {
          type: "object",
          additionalProperties: false,
          required: [
            "type",
            "items"
          ],
          properties: {
            type: {
              const: "list"
            },
            items: {
              type: "array",
              items: {
                type: "string"
              }
            }
          }
        },
        {
          type: "object",
          additionalProperties: false,
          required: [
            "type",
            "assetId"
          ],
          properties: {
            type: {
              const: "image"
            },
            assetId: {
              type: "string"
            }
          }
        },
        {
          type: "object",
          additionalProperties: false,
          required: [
            "type",
            "content"
          ],
          properties: {
            type: {
              const: "richParagraph"
            },
            content: {
              type: "array",
              maxItems: 500,
              items: {
                $ref: "#/$defs/inline"
              },
              minItems: 1
            }
          }
        },
        {
          type: "object",
          additionalProperties: false,
          required: [
            "type",
            "level",
            "content"
          ],
          properties: {
            type: {
              const: "richHeading"
            },
            level: {
              enum: [
                2,
                3
              ]
            },
            content: {
              type: "array",
              maxItems: 500,
              items: {
                $ref: "#/$defs/inline"
              },
              minItems: 1
            }
          }
        },
        {
          type: "object",
          additionalProperties: false,
          required: [
            "type",
            "ordered",
            "items"
          ],
          properties: {
            type: {
              const: "richList"
            },
            ordered: {
              type: "boolean"
            },
            items: {
              type: "array",
              maxItems: 100,
              items: {
                type: "array",
                maxItems: 500,
                items: {
                  $ref: "#/$defs/inline"
                },
                minItems: 1
              },
              minItems: 1
            }
          }
        }
      ]
    },
    media: {
      type: "object",
      additionalProperties: false,
      required: [
        "id",
        "src",
        "alt",
        "width",
        "height",
        "rights"
      ],
      properties: {
        familyId: {
          type: "string",
          pattern: "^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$"
        },
        id: {
          type: "string"
        },
        src: {
          type: "string"
        },
        alt: {
          type: "string"
        },
        width: {
          type: "integer",
          minimum: 1
        },
        height: {
          type: "integer",
          minimum: 1
        },
        credit: {
          type: "string"
        },
        rights: {
          type: "string",
          minLength: 1
        }
      }
    },
    page: {
      type: "object",
      additionalProperties: false,
      required: [
        "id",
        "siteId",
        "type",
        "slug",
        "title",
        "description",
        "intent",
        "body",
        "publishAt",
        "revisionHash",
        "approval",
        "media",
        "links",
        "contentVersion",
        "editorial",
        "siteSnapshot"
      ],
      properties: {
        id: {
          type: "string",
          minLength: 1,
          maxLength: 100,
          pattern: "^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$"
        },
        siteId: {
          type: "string"
        },
        type: {
          enum: [
            "home",
            "service",
            "product",
            "guide",
            "faq",
            "location",
            "article",
            "index",
            "author",
            "policy",
            "about",
            "contact"
          ]
        },
        slug: {
          type: "string",
          maxLength: 150
        },
        title: {
          type: "string",
          minLength: 1,
          maxLength: 1e3
        },
        description: {
          type: "string",
          minLength: 1,
          maxLength: 1e3
        },
        intent: {
          type: "string",
          minLength: 1,
          maxLength: 1e3
        },
        body: {
          type: "array",
          items: {
            $ref: "#/$defs/block"
          },
          minItems: 1,
          maxItems: 1e3
        },
        publishAt: {
          type: "string",
          format: "date-time",
          pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,3})?Z$"
        },
        revisionHash: {
          type: "string",
          pattern: "^[a-f0-9]{64}$"
        },
        approval: {
          type: "object",
          additionalProperties: false,
          required: [
            "status",
            "revisionHash",
            "approvedAt",
            "actorId"
          ],
          properties: {
            status: {
              const: "approved"
            },
            revisionHash: {
              type: "string",
              pattern: "^[a-f0-9]{64}$"
            },
            approvedAt: {
              type: "string",
              format: "date-time",
              pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,3})?Z$"
            },
            actorId: {
              type: "string"
            }
          }
        },
        media: {
          type: "array",
          maxItems: 60,
          items: {
            $ref: "#/$defs/media"
          }
        },
        links: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "targetPageId",
              "label"
            ],
            properties: {
              targetPageId: {
                type: "string"
              },
              label: {
                type: "string"
              }
            }
          }
        },
        externalLinks: {
          type: "array",
          maxItems: 20,
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "url",
              "label",
              "reason"
            ],
            properties: {
              url: {
                type: "string",
                format: "uri",
                pattern: "^https://"
              },
              label: {
                type: "string",
                minLength: 1
              },
              reason: {
                type: "string",
                minLength: 1
              }
            }
          }
        },
        contentVersion: {
          const: 2
        },
        editorial: {
          $ref: "#/$defs/editorial"
        },
        siteSnapshot: {
          type: "object",
          additionalProperties: false,
          required: [
            "id",
            "name",
            "canonicalHost",
            "locale",
            "timezone",
            "brand",
            "offer",
            "contact",
            "renderer",
            "operatorName"
          ],
          properties: {
            id: {
              type: "string"
            },
            name: {
              type: "string"
            },
            canonicalHost: {
              type: "string"
            },
            locale: {
              type: "string"
            },
            timezone: {
              type: "string"
            },
            brand: {
              type: "object",
              additionalProperties: false,
              required: [
                "accent"
              ],
              properties: {
                accent: {
                  type: "string"
                }
              }
            },
            offer: {
              type: "string"
            },
            contact: {
              type: "object",
              additionalProperties: false,
              required: [
                "email"
              ],
              properties: {
                email: {
                  type: "string",
                  format: "email"
                },
                phone: {
                  type: "string"
                }
              }
            },
            renderer: {
              enum: [
                "gift",
                "niche"
              ]
            },
            operatorName: {
              type: "string",
              minLength: 1,
              maxLength: 300
            }
          }
        }
      }
    },
    target: {
      oneOf: [
        {
          type: "object",
          additionalProperties: false,
          required: [
            "kind",
            "pageId"
          ],
          properties: {
            kind: {
              const: "page"
            },
            pageId: {
              type: "string",
              minLength: 1,
              maxLength: 100
            }
          }
        },
        {
          type: "object",
          additionalProperties: false,
          required: [
            "kind",
            "url"
          ],
          properties: {
            kind: {
              const: "external"
            },
            url: {
              type: "string",
              minLength: 1,
              maxLength: 2048,
              format: "uri",
              pattern: "^https://"
            }
          }
        },
        {
          type: "object",
          additionalProperties: false,
          required: [
            "kind",
            "siteId",
            "pageId"
          ],
          properties: {
            kind: {
              const: "network"
            },
            siteId: {
              type: "string",
              pattern: "^[a-z0-9][a-z0-9-]{1,62}$"
            },
            pageId: {
              type: "string",
              minLength: 1,
              maxLength: 100
            }
          }
        },
        {
          type: "object",
          additionalProperties: false,
          required: [
            "kind",
            "targetId"
          ],
          properties: {
            kind: {
              const: "commerce"
            },
            targetId: {
              type: "string",
              minLength: 1,
              maxLength: 100
            }
          }
        }
      ]
    },
    inline: {
      oneOf: [
        {
          type: "object",
          additionalProperties: false,
          required: [
            "type",
            "text"
          ],
          properties: {
            type: {
              const: "text"
            },
            text: {
              type: "string",
              minLength: 1,
              maxLength: 12e3
            }
          }
        },
        {
          type: "object",
          additionalProperties: false,
          required: [
            "type",
            "text",
            "target"
          ],
          properties: {
            type: {
              const: "link"
            },
            text: {
              type: "string",
              minLength: 1,
              maxLength: 1e3
            },
            target: {
              $ref: "#/$defs/target"
            }
          }
        }
      ]
    },
    author: {
      type: "object",
      additionalProperties: false,
      required: [
        "id",
        "siteId",
        "locale",
        "slug",
        "name",
        "role",
        "bio",
        "kind",
        "sameAs"
      ],
      properties: {
        id: {
          type: "string",
          minLength: 1,
          maxLength: 100
        },
        siteId: {
          type: "string",
          pattern: "^[a-z0-9][a-z0-9-]{1,62}$"
        },
        locale: {
          type: "string",
          minLength: 1,
          maxLength: 30
        },
        slug: {
          type: "string",
          minLength: 1,
          maxLength: 150
        },
        name: {
          type: "string",
          minLength: 1,
          maxLength: 200
        },
        role: {
          type: "string",
          maxLength: 300
        },
        bio: {
          type: "string",
          maxLength: 12e3
        },
        kind: {
          enum: [
            "person",
            "organization"
          ]
        },
        sameAs: {
          type: "array",
          maxItems: 20,
          items: {
            type: "string",
            minLength: 1,
            maxLength: 2048,
            format: "uri",
            pattern: "^https://"
          }
        }
      }
    },
    source: {
      type: "object",
      additionalProperties: false,
      required: [
        "id",
        "title",
        "publisher",
        "url",
        "accessedAt",
        "public"
      ],
      properties: {
        id: {
          type: "string",
          minLength: 1,
          maxLength: 100
        },
        title: {
          type: "string",
          minLength: 1,
          maxLength: 500
        },
        publisher: {
          type: "string",
          minLength: 1,
          maxLength: 300
        },
        url: {
          type: "string",
          minLength: 1,
          maxLength: 2048,
          format: "uri",
          pattern: "^https://"
        },
        accessedAt: {
          type: "string",
          format: "date-time",
          pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,3})?Z$"
        },
        public: {
          const: true
        }
      }
    },
    commerceTarget: {
      type: "object",
      additionalProperties: false,
      required: [
        "id",
        "url",
        "label",
        "relationship",
        "verified",
        "checkedAt"
      ],
      properties: {
        id: {
          type: "string",
          minLength: 1,
          maxLength: 100
        },
        url: {
          type: "string",
          minLength: 1,
          maxLength: 2048,
          format: "uri",
          pattern: "^https://"
        },
        label: {
          type: "string",
          minLength: 1,
          maxLength: 200
        },
        relationship: {
          type: "string",
          minLength: 1,
          maxLength: 500
        },
        verified: {
          type: "boolean"
        },
        checkedAt: {
          anyOf: [
            {
              type: "string",
              format: "date-time",
              pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,3})?Z$"
            },
            {
              type: "null"
            }
          ]
        }
      }
    },
    editorial: {
      type: "object",
      additionalProperties: false,
      required: [
        "category",
        "readingMinutes",
        "authors",
        "sources",
        "datePublished",
        "dateModified",
        "productRecommendation",
        "featuredImageId",
        "relatedPageIds",
        "commerceTargets"
      ],
      properties: {
        category: {
          type: "string",
          maxLength: 200
        },
        readingMinutes: {
          type: "integer",
          minimum: 0,
          maximum: 1e3
        },
        authors: {
          type: "array",
          maxItems: 20,
          items: {
            $ref: "#/$defs/author"
          }
        },
        sources: {
          type: "array",
          maxItems: 100,
          items: {
            $ref: "#/$defs/source"
          }
        },
        datePublished: {
          anyOf: [
            {
              type: "string",
              format: "date-time",
              pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,3})?Z$"
            },
            {
              type: "null"
            }
          ]
        },
        dateModified: {
          anyOf: [
            {
              type: "string",
              format: "date-time",
              pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,3})?Z$"
            },
            {
              type: "null"
            }
          ]
        },
        productRecommendation: {
          type: "boolean"
        },
        featuredImageId: {
          anyOf: [
            {
              type: "string",
              minLength: 1,
              maxLength: 100
            },
            {
              type: "null"
            }
          ]
        },
        relatedPageIds: {
          type: "array",
          maxItems: 100,
          items: {
            type: "string",
            minLength: 1,
            maxLength: 100
          }
        },
        commerceTargets: {
          type: "array",
          maxItems: 30,
          items: {
            $ref: "#/$defs/commerceTarget"
          }
        }
      }
    }
  }
};

// content-studio/src/content-package-v2.mjs
var fail = (message) => {
  throw new Error("Invalid content v2: " + message);
};
var stableV2 = (value) => Array.isArray(value) ? `[${value.map(stableV2).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stableV2(value[k])}`).join(",")}}` : JSON.stringify(value);
function assertSchema(value, rule, label = "package") {
  if (rule.$ref) return assertSchema(value, rule.$ref.split("/").slice(1).reduce((s, k) => s[k], content_package_v2_schema_default), label);
  for (const key of ["oneOf", "anyOf"]) if (rule[key]) {
    const matches = rule[key].filter((r) => {
      try {
        assertSchema(value, r, label);
        return true;
      } catch {
        return false;
      }
    }).length;
    if (!matches || key === "oneOf" && matches !== 1) fail(label + " does not match " + key);
  }
  if ("const" in rule && value !== rule.const) fail(label + " const");
  if (rule.enum && !rule.enum.includes(value)) fail(label + " enum");
  if (rule.type) {
    const valid = rule.type === "null" ? value === null : rule.type === "array" ? Array.isArray(value) : rule.type === "object" ? value !== null && typeof value === "object" && !Array.isArray(value) : rule.type === "integer" ? Number.isInteger(value) : typeof value === rule.type;
    if (!valid) fail(label + " type " + rule.type);
  }
  if (typeof value === "string") {
    if (rule.minLength !== void 0 && value.length < rule.minLength || rule.maxLength !== void 0 && value.length > rule.maxLength) fail(label + " length");
    if (rule.pattern && !new RegExp(rule.pattern).test(value)) fail(label + " pattern");
    if (rule.format === "date-time") {
      const time = Date.parse(value);
      if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 19) !== value.slice(0, 19)) fail(label + " invalid UTC date");
    }
    if (rule.format === "uri") {
      let u;
      try {
        u = new URL(value);
      } catch {
        fail(label + " URL");
      }
      if (u.protocol !== "https:" || u.username || u.password || u.port || !/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(u.hostname)) fail(label + " public HTTPS URL");
    }
    if (rule.format === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) fail(label + " email");
  }
  if (typeof value === "number" && (rule.minimum !== void 0 && value < rule.minimum || rule.maximum !== void 0 && value > rule.maximum)) fail(label + " range");
  if (Array.isArray(value)) {
    if (rule.minItems !== void 0 && value.length < rule.minItems || rule.maxItems !== void 0 && value.length > rule.maxItems) fail(label + " items");
    if (rule.items) value.forEach((item, i) => assertSchema(item, rule.items, `${label}[${i}]`));
  }
  if (value && typeof value === "object" && !Array.isArray(value) && rule.properties) {
    for (const key of rule.required || []) if (!(key in value)) fail(label + " missing " + key);
    for (const [key, item] of Object.entries(value)) {
      if (!(key in rule.properties)) {
        if (rule.additionalProperties === false) fail(label + " unknown " + key);
      } else assertSchema(item, rule.properties[key], label + "." + key);
    }
  }
}
function v2RevisionPayload(page) {
  const { id, siteId, contentVersion, type, slug, title, description, intent, body, publishAt, media, links, editorial, siteSnapshot } = page;
  return { id, siteId, contentVersion, type, slug, title, description, intent, body, publishAt, media, links, externalLinks: (page.externalLinks || []).map(({ url, label, reason }) => ({ url, label, reason })), editorial, siteSnapshot };
}
var v2RevisionHash = (page) => createHash("sha256").update(stableV2(v2RevisionPayload(page)), "utf8").digest("hex");
function inlineNodes(page) {
  return page.body.flatMap((b) => b.content || (b.type === "richList" ? b.items.flat() : []));
}
function bodyPlainText(body) {
  return body.map((b) => b.text ?? (b.content ? b.content.map((n) => n.text).join("") : b.type === "richList" ? b.items.map((row) => row.map((n) => n.text).join("")).join("\n") : b.items?.join("\n") || "")).join("\n");
}
function normalizeV2Blocks(body) {
  assertSchema(body, { type: "array", maxItems: 1e3, items: { $ref: "#/$defs/block" } }, "body");
  for (const b of body) {
    if (["paragraph", "heading"].includes(b.type) && !b.text.trim()) fail("empty block");
    if (b.type === "list" && (!b.items.length || b.items.some((t) => !t.trim()))) fail("empty list");
    if (b.content && !b.content.map((n) => n.text).join("").trim()) fail("empty rich block");
  }
  return structuredClone(body);
}
function validateV2Draft(page, site) {
  const candidate = { ...v2RevisionPayload(page), revisionHash: "0".repeat(64), approval: { status: "approved", revisionHash: "0".repeat(64), approvedAt: "2000-01-01T00:00:00.000Z", actorId: "structural-validator" } };
  assertSchema(candidate, content_package_v2_schema_default.$defs.page, "page");
  normalizeV2Blocks(page.body);
  if (page.contentVersion !== 2) fail("contentVersion must be 2");
  if (!/^(?:[a-z0-9]+(?:[-/][a-z0-9]+)*)?$/.test(page.slug) || /^(niche|api)(\/|$)/.test(page.slug)) fail("unsafe slug");
  if (page.type === "home" !== (page.slug === "")) fail("home slug mismatch");
  if (site && stableV2(page.siteSnapshot) !== stableV2(site)) fail("siteSnapshot mismatch: reapprove after site fact changes");
  const media = new Set(page.media.map((m) => m.id));
  if (media.size !== page.media.length) fail("duplicate media ID");
  for (const m of page.media) if (!new RegExp(`^/content-assets/${page.siteId}/[a-zA-Z0-9._-]+\\.(webp|avif)$`).test(m.src)) fail("media site/path mismatch");
  for (const b of page.body) if (b.type === "image" && !media.has(b.assetId)) fail("missing image");
  if (page.editorial.featuredImageId && !media.has(page.editorial.featuredImageId)) fail("missing featured image");
  for (const a of page.editorial.authors) if (a.siteId !== page.siteId || a.locale !== page.siteSnapshot.locale) fail("author scope mismatch");
  for (const key of ["authors", "sources", "commerceTargets"]) {
    const ids = page.editorial[key].map((x) => x.id);
    if (new Set(ids).size !== ids.length) fail("duplicate editorial " + key);
  }
  const commerce = new Set(page.editorial.commerceTargets.map((t) => t.id));
  for (const node of inlineNodes(page)) if (node.type === "link" && node.target.kind === "commerce" && !commerce.has(node.target.targetId)) fail("unknown commerce snapshot");
  for (const t of page.editorial.commerceTargets) if (t.verified && !t.checkedAt) fail("verified commerce needs checkedAt");
  if (page.editorial.datePublished && page.editorial.dateModified && Date.parse(page.editorial.dateModified) < Date.parse(page.editorial.datePublished)) fail("dateModified before datePublished");
  return page;
}

// content-studio/src/minimum-content.mjs
var promedicalIndexMinimums = /* @__PURE__ */ new Map([
  ["10af45c9-03a7-4e29-8145-661dde7f44e4", 117],
  ["4a80eebf-f530-44b2-b734-caba73aab699", 97]
]);
function shortIndexMinimum(site, page) {
  return site.id === "promedical" && page.siteId === site.id && page.type === "faq" ? promedicalIndexMinimums.get(page.id) : void 0;
}
function hasMinimumContent(site, page) {
  const text2 = page.contentVersion === 2 ? bodyPlainText(page.body) : page.body.map((block) => block.text || block.items?.join(" ") || "").join(" ");
  const exception = shortIndexMinimum(site, page);
  return text2.length >= (exception ?? 120) && (exception === void 0 || Boolean(text2.trim()));
}

// content-studio/src/network-links.mjs
function anchorPlacement(page, label) {
  return (page.body || []).findIndex((block) => block.type === "paragraph" && block.text.includes(label) || block.type === "list" && block.items.some((text2) => text2.includes(label)));
}
function networkStatus(sourceSiteId, page, link, catalog, now = Date.now()) {
  const target = catalog.find((item) => item.siteId === link.targetSiteId && item.pageId === link.targetPageId);
  const placement = anchorPlacement(page, link.label);
  let status;
  if (!target) status = "missing";
  else if (target.siteId === sourceSiteId) status = "internal";
  else if (!target.approved) status = "unapproved";
  else if (Date.parse(target.publishAt) > now) status = "scheduled";
  else if (!target.eligibleRevision) status = "revoked";
  else if (target.stage !== "live") status = "not-live";
  else if (placement < 0) status = "no-anchor";
  else if (!link.evidence || link.evidence.revisionHash !== target.revisionHash || link.evidence.canonical !== target.url || link.evidence.status !== 200 || now - Date.parse(link.evidence.checkedAt) > 7 * 864e5 || !Number.isFinite(Date.parse(link.evidence.checkedAt))) status = "needs-check";
  else status = "ready";
  return { ...link, target, placement, status };
}

// content-studio/src/authoring-core.mjs
var plain = (value, max = 4e3) => String(value ?? "").trim().slice(0, max);
var PAGE_MEDIA_LIMIT = 60;
var publicSite = (site) => ({ id: site.id, name: site.name, canonicalHost: site.canonicalHost, locale: site.locale, timezone: site.timezone, brand: site.brand, offer: site.offer, contact: site.contact, ...site.schemaVersion === 2 ? { renderer: site.renderer, operatorName: site.operatorName } : {} });
function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
function revisionPayload(page) {
  if (page.contentVersion === 2) return v2RevisionPayload(page);
  const { siteId, type, slug, title, description, intent, body, publishAt, media, links } = page;
  const payload = { siteId, type, slug, title, description, intent, body, publishAt, media, links };
  if (page.externalLinks?.length) payload.externalLinks = page.externalLinks.map(({ url, label, reason }) => ({ url, label, reason }));
  return payload;
}
function revisionHash(page) {
  return page.contentVersion === 2 ? v2RevisionHash(page) : createHash2("sha256").update(stable(revisionPayload(page))).digest("hex");
}
function normalizeBlocks(input) {
  if (!Array.isArray(input)) throw new Error("Turinys turi b\u016Bti blok\u0173 s\u0105ra\u0161as.");
  if (input.length > 100) throw new Error("Per daug turinio blok\u0173.");
  return input.map((block) => {
    if (block.type === "heading") return { type: "heading", level: block.level === 3 ? 3 : 2, text: plain(block.text, 500) };
    if (block.type === "list") return { type: "list", items: (Array.isArray(block.items) ? block.items : []).slice(0, 30).map((item) => plain(item, 700)) };
    if (block.type === "image") return { type: "image", assetId: plain(block.assetId, 80) };
    if (block.type === "paragraph") return { type: "paragraph", text: plain(block.text, 3e3) };
    throw new Error("Ne\u017Einomas turinio bloko tipas.");
  });
}
function approveDraftSnapshot(site, page, actorId, { batchIds = /* @__PURE__ */ new Set(), networkIndex, networkDomains, now = Date.now() }) {
  const siteId = site.id;
  if (!page) throw Object.assign(new Error("Puslapis nerastas."), { status: 404 });
  if (page.factChecks?.length) throw new Error("I\u0161spr\u0119skite fakt\u0173 patikros pastabas ir i\u0161saugokite nauj\u0105 versij\u0105 prie\u0161 tvirtinim\u0105.");
  if (!site.name || !site.offer || !site.facts?.trim() || !page.title || !page.description || !page.intent || !page.body.length) throw new Error("Patvirtinimui reikia patikrint\u0173 svetain\u0117s verslo fakt\u0173, pasi\u016Blymo, puslapio antra\u0161t\u0117s, apra\u0161ymo, ketinimo ir turinio.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(site.contact.email || "")) throw new Error("Prie\u0161 publikavim\u0105 \u012Fra\u0161ykite taisykling\u0105 veikian\u010Dio el. pa\u0161to adres\u0105.");
  if (site.contact.phone && !/^\+?[\d\s().-]{7,30}$/.test(site.contact.phone)) throw new Error("Neteisingas telefono numeris. Palikite lauk\u0105 tu\u0161\u010Di\u0105 arba \u012Fra\u0161ykite tikr\u0105 numer\u012F.");
  if (page.contentVersion === 2) {
    page.siteSnapshot = structuredClone(publicSite(site));
    validateV2Draft(page, publicSite(site));
    if (["article", "guide"].includes(page.type) && !page.editorial.authors.length) throw new Error("Straipsniui reikia tikro redakcinio autoriaus snapshot.");
  }
  if (!hasMinimumContent(site, page)) throw new Error("Turinyje per ma\u017Eai naudingos informacijos.");
  for (const block of page.body) {
    if ((block.type === "paragraph" || block.type === "heading") && !block.text) throw new Error("Puslapyje yra tu\u0161\u010Dias teksto blokas.");
    if (block.type === "list" && (!block.items.length || block.items.some((item) => !item))) throw new Error("Puslapyje yra tu\u0161\u010Dias s\u0105ra\u0161as.");
  }
  if (page.media.length > PAGE_MEDIA_LIMIT) throw new Error(`Puslapyje telpa iki ${PAGE_MEDIA_LIMIT} medijos variant\u0173.`);
  for (const item of page.media) if (!item.alt || !item.rights || !item.width || !item.height) throw new Error("Vaizdams reikia alt teksto, matmen\u0173 ir naudojimo teisi\u0173.");
  for (const block of page.body) if (block.type === "image" && !page.media.some((item) => item.id === block.assetId)) throw new Error("Turinio vaizdas n\u0117ra priskirtas puslapio medijai.");
  for (const link of page.links) if (!link.label || !site.pages.some((item) => item.id === link.targetPageId && (page.contentVersion === 2 || item.publishedRevision || batchIds.has(item.id)))) throw new Error("Vidin\u0117 nuoroda nurodo nepatvirtint\u0105 arba ne\u017Einom\u0105 puslap\u012F.");
  if (!Array.isArray(networkIndex) || !(networkDomains instanceof Set)) throw new Error("Approval network context is required.");
  for (const source of page.externalLinks || []) {
    let url;
    try {
      url = new URL(source.url);
    } catch {
      throw new Error("I\u0161orinio \u0161altinio URL neteisingas.");
    }
    if (!source.url.startsWith("https://") || url.protocol !== "https:" || !url.hostname || url.username || url.password || !source.label || !source.reason || !source.verified) throw new Error("I\u0161oriniam \u0161altiniui reikia vie\u0161o HTTPS adreso be prisijungimo duomen\u0173, pavadinimo, paai\u0161kinimo ir patikros.");
    if (networkDomains.has(url.hostname)) {
      const proposed = (page.networkLinkSuggestions || []).find((link) => networkIndex.some((target) => target.siteId === link.targetSiteId && target.pageId === link.targetPageId && target.url === source.url));
      if (!proposed || proposed.label !== source.label || networkStatus(siteId, page, proposed, networkIndex).status !== "ready") throw new Error("Tinklo nuoroda dar nepatikrinta, jos tikslas nevie\u0161as arba tekste n\u0117ra numatyto konteksto.");
    }
  }
  const hash = revisionHash(page);
  const approval = { status: "approved", revisionHash: hash, approvedAt: new Date(now).toISOString(), actorId: plain(actorId, 120) || "local-editor" };
  page.status = "approved";
  page.approval = approval;
  page.revisionHash = hash;
  page.publishedRevision = structuredClone({ ...revisionPayload(page), id: page.id, revisionHash: hash, approval });
  for (const asset of site.assets) if (page.media.some((item) => item.id === asset.id)) asset.metadataPublished = true;
  page.updatedAt = new Date(now).toISOString();
  return page;
}

// content-studio/src/content-workflow.mjs
import { createHash as createHash3 } from "node:crypto";

// content-studio/src/content-schedule.mjs
var wallParts = (instant, timezone) => Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(instant)).map((p) => [p.type, p.value]));
function localPublishAt(date, time, timezone) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error("Neteisinga vietin\u0117 data arba laikas.");
  const desired = `${date}T${time}`, nominal = Date.parse(desired + ":00.000Z");
  if (!Number.isFinite(nominal) || new Date(nominal).toISOString().slice(0, 16) !== desired) throw new Error("Neteisinga kalendoriaus data.");
  let guess = nominal;
  for (let i = 0; i < 4; i++) {
    const p = wallParts(guess, timezone);
    const actual = Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00.000Z`);
    guess += nominal - actual;
  }
  const matches = (value) => {
    const p = wallParts(value, timezone);
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}` === desired;
  };
  if (!matches(guess)) throw new Error("\u0160is vietinis laikas neegzistuoja d\u0117l laikrod\u017Eio persukimo.");
  if ([-120, -90, -60, -30, 30, 60, 90, 120].some((minutes) => matches(guess + minutes * 6e4))) throw new Error("\u0160is vietinis laikas dviprasmis d\u0117l laikrod\u017Eio persukimo; pasirinkite kit\u0105 laik\u0105.");
  return new Date(guess).toISOString();
}

// content-studio/src/content-workflow.mjs
var REVIEW_AREAS = ["usefulness", "facts", "sources", "media", "links", "presentation"];
var stable2 = (value) => Array.isArray(value) ? `[${value.map(stable2).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stable2(value[k])}`).join(",")}}` : JSON.stringify(value);
function reviewBinding(site, page, hash) {
  return createHash3("sha256").update(stable2({
    siteId: site.id,
    revisionHash: hash,
    context: { name: site.name, offer: site.offer, facts: site.facts, audience: site.audience, contact: site.contact, canonicalHost: site.canonicalHost, timezone: site.timezone, locale: site.locale, brand: site.brand, operatorName: site.operatorName ?? null, renderer: site.renderer ?? null },
    factChecks: page.factChecks || [],
    linkSuggestions: page.linkSuggestions || [],
    networkLinkSuggestions: page.networkLinkSuggestions || []
  })).digest("hex");
}
function editorialReview(site, page, hash, input, now = Date.now()) {
  if (input?.revisionHash !== hash) throw new Error("Per\u017Ei\u016Brima revizija pasikeit\u0117; i\u0161 naujo perskaitykite turin\u012F.");
  if (typeof input.reviewer !== "string" || !input.reviewer.trim() || input.reviewer.length > 120) throw new Error("Reikia tikro per\u017Ei\u016Brin\u010Dio agento / redaktoriaus ID.");
  const evidence = {};
  for (const area of REVIEW_AREAS) {
    const note = input.evidence?.[area];
    if (typeof note !== "string" || note.trim().length < 20 || note.length > 4e3) throw new Error(`Per\u017Ei\u016Bros sri\u010Diai ${area} reikia konkretaus \u012Frodym\u0173 paai\u0161kinimo (20\u20134000 simboli\u0173).`);
    evidence[area] = note.trim();
  }
  return { version: 1, reviewer: input.reviewer.trim(), checkedAt: new Date(now).toISOString(), revisionHash: hash, binding: reviewBinding(site, page, hash), evidence };
}
function reviewCurrent(site, page, hash) {
  return page.editorialReview?.version === 1 && page.editorialReview.revisionHash === hash && page.editorialReview.binding === reviewBinding(site, page, hash);
}
function internalTargets(page) {
  const ids = [...(page.links || []).map((l) => l.targetPageId)];
  if (page.contentVersion === 2) ids.push(...inlineNodes(page).filter((n) => n.type === "link" && n.target.kind === "page").map((n) => n.target.pageId), ...page.editorial?.relatedPageIds || []);
  return [...new Set(ids)];
}
function pageReadiness(site, page, hash, selectedIds = /* @__PURE__ */ new Set()) {
  const blockers = [];
  if (!page.body.length || !bodyPlainText(page.body).trim()) blockers.push("Turinys neparengtas.");
  if (shortIndexMinimum(site, page) !== void 0 && !hasMinimumContent(site, page)) blockers.push("Turinyje per ma\u017Eai naudingos informacijos.");
  if (page.factChecks?.length) blockers.push("Yra nei\u0161spr\u0119st\u0173 fakt\u0173 / aset\u0173 pastab\u0173.");
  if (!reviewCurrent(site, page, hash)) blockers.push("Tr\u016Bksta aktualios agento redakcin\u0117s per\u017Ei\u016Bros.");
  if (["guide", "article"].includes(page.type) && !page.media.length) blockers.push("Gidui / straipsniui reikia tikro per\u017Ei\u016Br\u0117to temos vaizdo.");
  if ((page.externalLinks || []).some((l) => !l.verified)) blockers.push("Yra nepatikrint\u0173 i\u0161orini\u0173 \u0161altini\u0173.");
  const linked = new Set((page.links || []).map((l) => l.targetPageId));
  if ((page.linkSuggestions || []).some((l) => !linked.has(l.targetPageId))) blockers.push("Planuotos vidin\u0117s nuorodos dar neu\u017Ebaigtos.");
  for (const id of internalTargets(page)) {
    const target = site.pages.find((p) => p.id === id && p.siteId === site.id);
    if (!target || target.status === "revoked" || !selectedIds.has(id) && !target.publishedRevision) blockers.push(`Vidinio ry\u0161io tikslas dar neparengtas: ${id}.`);
  }
  return { pageId: page.id, title: page.title, publishAt: page.publishAt, revisionHash: hash, state: blockers.length ? "blocked" : "reviewed", blockers };
}

// content-studio/src/hosted-authoring.mjs
var error = (message) => Object.assign(new Error(message), { status: 400 });
function text(value, limit, label) {
  if (typeof value !== "string" || !value.trim() || value.length > limit) throw error(`${label}: reikia1\u2013${limit} simboli\u0173.`);
  return value.trim();
}
function editHostedDraft(base, input, timezone = "Europe/Vilnius") {
  const allowed = /* @__PURE__ */ new Set(["title", "description", "body", "localDate", "localTime"]);
  if (!input || typeof input !== "object" || Object.keys(input).some((k) => !allowed.has(k))) throw error("Neleid\u017Eiami redagavimo laukai.");
  const draft = structuredClone(base);
  if ("title" in input) draft.title = text(input.title, 300, "Antra\u0161t\u0117");
  if ("description" in input) draft.description = text(input.description, 300, "Apra\u0161ymas");
  if ("body" in input) {
    if (!Array.isArray(input.body) || !input.body.length || input.body.length > 100) throw error("Reikia1\u2013100 turinio blok\u0173.");
    for (const b of input.body) {
      if (!b || typeof b !== "object") throw error("Netinkamas turinio blokas.");
      if (b.type === "paragraph") text(b.text, 3e3, "Pastraipa");
      else if (b.type === "heading") {
        text(b.text, 500, "Skyriaus antra\u0161t\u0117");
        if (![2, 3].includes(b.level)) throw error("Antra\u0161t\u0117s lygis turi b\u016Bti2 arba3.");
      } else if (b.type === "list") {
        if (!Array.isArray(b.items) || !b.items.length || b.items.length > 30) throw error("S\u0105ra\u0161e turi b\u016Bti1\u201330 punkt\u0173.");
        for (const item of b.items) text(item, 700, "S\u0105ra\u0161o punktas");
      } else if (b.type === "image") {
        if (!base.media.some((a) => a.id === b.assetId)) throw error("Ne\u017Einomas turinio vaizdas.");
      } else throw error("Ne\u017Einomas turinio bloko tipas.");
    }
    draft.body = normalizeBlocks(input.body);
  }
  if ("localDate" in input || "localTime" in input) {
    try {
      draft.publishAt = localPublishAt(input.localDate, input.localTime, timezone);
    } catch (e) {
      e.status = 400;
      throw e;
    }
  }
  delete draft.approval;
  delete draft.revisionHash;
  draft.revisionHash = revisionHash(draft);
  return draft;
}
async function approveHostedDraft(context, draft, actorId, evidence, verifyMedia, at = Date.now()) {
  if (!actorId || !context || context.id !== draft.siteId) throw error("N\u0117ra redaktoriaus arba svetain\u0117s konteksto.");
  const page = structuredClone(draft);
  const hash = revisionHash(page);
  page.editorialReview = editorialReview(context, page, hash, { revisionHash: hash, reviewer: actorId, evidence }, at);
  const ready = pageReadiness(context, page, hash);
  if (ready.blockers.length) throw error(ready.blockers.join(" "));
  if (typeof verifyMedia !== "function") throw error("N\u0117ra medijos saugyklos patikros.");
  for (const asset of page.media) await verifyMedia(asset);
  approveDraftSnapshot(context, page, actorId, { networkIndex: context.networkIndex || [], networkDomains: new Set(context.networkDomains || []), now: at });
  return { page: page.publishedRevision, review: page.editorialReview };
}
export {
  approveHostedDraft,
  editHostedDraft,
  localPublishAt,
  revisionHash,
  revisionPayload
};
