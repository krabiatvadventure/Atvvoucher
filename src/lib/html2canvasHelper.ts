/**
 * Helper to clean cloned document elements and stylesheets for html2canvas.
 * Since Tailwind CSS v4 uses modern color functions like oklch() or oklab()
 * which are unsupported by html2canvas, this helper parses and replaces them
 * with standard browser-supported color strings (e.g. #rrggbb or rgb/rgba)
 * in all style tags and elements' inline/computed styles.
 */

export const cleanClonedDocForHtml2Canvas = (clonedDoc: Document) => {
  // Create a canvas to resolve colors natively using the browser's 2D context
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');

  const resolveModernColor = (color: string): string => {
    if (!color) return '';
    if (color.includes('oklch') || color.includes('oklab')) {
      if (ctx) {
        try {
          ctx.fillStyle = color;
          const resolved = ctx.fillStyle;
          if (resolved) {
            return resolved;
          }
        } catch (e) {
          // ignore
        }
      }
      return '#000000'; // fallback color to prevent crash
    }
    return color;
  };

  // 1. Process all <style> tags in cloned document
  try {
    const styleTags = clonedDoc.querySelectorAll('style');
    styleTags.forEach(styleTag => {
      let cssText = styleTag.innerHTML;
      if (cssText.includes('oklch') || cssText.includes('oklab')) {
        // Regex to find color functions. It matches oklch(L C H) or oklch(L C H / A) and oklab(...)
        cssText = cssText.replace(/(oklch|oklab)\([^)]+\)/g, (match) => {
          return resolveModernColor(match);
        });
        styleTag.innerHTML = cssText;
      }
    });
  } catch (err) {
    console.error('Error cleaning stylesheets in html2canvas helper:', err);
  }

  // 2. Process inline styles of all elements in cloned document
  try {
    const elements = clonedDoc.getElementsByTagName('*');
    const colorProps = [
      'color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderRightColor', 
      'borderBottomColor', 'borderLeftColor', 'fill', 'stroke', 'outlineColor'
    ];
    
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i] as HTMLElement;
      if (el.style) {
        colorProps.forEach(prop => {
          const val = el.style[prop as any];
          if (val && (val.includes('oklch') || val.includes('oklab'))) {
            el.style[prop as any] = resolveModernColor(val);
          }
        });
      }
    }
  } catch (err) {
    console.error('Error cleaning elements in html2canvas helper:', err);
  }
};

/**
 * Wrapper to clean original document styles temporarily during html2canvas render to prevent parser crashes.
 */
export const cleanOriginalStylesAndRun = async <T>(fn: () => Promise<T>): Promise<T> => {
  const dummy = document.createElement('div');
  dummy.style.display = 'none';
  document.body.appendChild(dummy);

  const resolveColor = (colorStr: string): string => {
    try {
      dummy.style.color = '';
      dummy.style.color = colorStr;
      const computed = window.getComputedStyle(dummy).color;
      if (computed && !computed.includes('oklch') && !computed.includes('oklab')) {
        return computed;
      }
    } catch (e) {}
    return 'rgb(0, 0, 0)';
  };

  const styleTags = Array.from(document.querySelectorAll('style'));
  const originalStyles = styleTags.map(tag => ({
    tag,
    html: tag.innerHTML
  }));

  try {
    styleTags.forEach(styleTag => {
      let cssText = styleTag.innerHTML;
      if (cssText.includes('oklch') || cssText.includes('oklab')) {
        cssText = cssText.replace(/(oklch|oklab)\s*\([^)]+\)/g, (match) => {
          return resolveColor(match);
        });
        styleTag.innerHTML = cssText;
      }
    });

    return await fn();
  } finally {
    // Restore original styles
    originalStyles.forEach(({ tag, html }) => {
      tag.innerHTML = html;
    });
    if (dummy.parentNode) {
      dummy.parentNode.removeChild(dummy);
    }
  }
};
