function walk(node, visit) {
  if (!node || typeof node !== 'object') {
    return;
  }

  visit(node);

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      walk(child, visit);
    }
  }
}

export default function rehypeLinkPolicy(options = {}) {
  const blockedDomains = (options.blockedDomains ?? []).map((domain) => String(domain).toLowerCase());

  return (tree) => {
    walk(tree, (node) => {
      if (node.type !== 'element' || node.tagName !== 'a') {
        return;
      }

      const href = node.properties?.href;
      if (!href || typeof href !== 'string' || href.startsWith('/') || href.startsWith('#')) {
        return;
      }

      let url;
      try {
        url = new URL(href);
      } catch {
        return;
      }

      const hostname = url.hostname.toLowerCase();
      const isBlocked = blockedDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));

      if (isBlocked) {
        node.tagName = 'span';
        node.properties = {
          ...node.properties,
          className: ['blocked-external-link'],
        };
        delete node.properties.href;
        delete node.properties.target;
        delete node.properties.rel;
        return;
      }

      node.properties = {
        ...node.properties,
        target: '_blank',
        rel: 'nofollow noopener noreferrer',
      };
    });
  };
}
