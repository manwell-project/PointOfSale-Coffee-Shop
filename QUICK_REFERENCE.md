# ☕ Coffee Shop POS - Quick Reference Card

## 🎨 Color Palette

### Primary (Coffee Brown)
```css
var(--color-primary)         /* #6B4423 - Main brand */
var(--color-primary-light)   /* #8B5A3C - Lighter */
var(--color-primary-dark)    /* #4A2E18 - Darker */
```

### Secondary (Beige/Cream)
```css
var(--color-secondary)       /* #D4A574 */
var(--color-secondary-light) /* #E8C9A0 */
```

### Accent (Terracotta)
```css
var(--color-accent)          /* #C17B5C */
```

### Semantic
```css
var(--color-success)  /* #28A745 - Green */
var(--color-warning)  /* #FFC107 - Yellow */
var(--color-danger)   /* #DC3545 - Red */
var(--color-info)     /* #17A2B8 - Cyan */
```

---

## 📏 Spacing (4px base)

```css
var(--spacing-1)  /*  4px - xs */
var(--spacing-2)  /*  8px - sm */
var(--spacing-3)  /* 12px */
var(--spacing-4)  /* 16px - md (base) */
var(--spacing-5)  /* 20px */
var(--spacing-6)  /* 24px - lg */
var(--spacing-8)  /* 32px - xl */
```

**Semantic:**
```css
var(--spacing-xs)  /*  4px */
var(--spacing-sm)  /*  8px */
var(--spacing-md)  /* 16px */
var(--spacing-lg)  /* 24px */
var(--spacing-xl)  /* 32px */
```

---

## 🔤 Typography

### Font Sizes
```css
var(--font-size-xs)   /* 12px */
var(--font-size-sm)   /* 14px */
var(--font-size-md)   /* 16px - base */
var(--font-size-lg)   /* 18px */
var(--font-size-xl)   /* 20px */
var(--font-size-2xl)  /* 24px */
var(--font-size-3xl)  /* 30px */
var(--font-size-4xl)  /* 36px */
```

### Font Weights
```css
var(--font-weight-normal)    /* 400 */
var(--font-weight-medium)    /* 500 */
var(--font-weight-semibold)  /* 600 */
var(--font-weight-bold)      /* 700 */
```

---

## 🌑 Shadows

```css
var(--shadow-xs)   /* Minimal */
var(--shadow-sm)   /* Cards at rest */
var(--shadow-md)   /* Cards hover */
var(--shadow-lg)   /* Dropdowns */
var(--shadow-xl)   /* Modals */

/* Themed */
var(--shadow-coffee)   /* Primary elements */
var(--shadow-success)  /* Success states */
var(--shadow-danger)   /* Error states */
```

---

## 🔘 Border Radius

```css
var(--radius-sm)    /*  4px */
var(--radius-md)    /*  8px */
var(--radius-lg)    /* 12px */
var(--radius-xl)    /* 16px */
var(--radius-full)  /* 9999px - Pills */
var(--radius-circle) /* 50% - Circle */
```

---

## ⚡ Transitions

```css
var(--transition-base)  /* All 250ms ease-in-out */
var(--transition-fast)  /* All 150ms ease-in-out */
var(--transition-slow)  /* All 350ms ease-in-out */

var(--duration-fast)    /* 150ms */
var(--duration-normal)  /* 250ms */
var(--duration-slow)    /* 350ms */
```

---

## 🛠️ Common Utility Classes

### Colors
```css
.text-primary, .text-coffee-primary
.bg-white, .bg-coffee-gradient
.text-success, .text-danger
```

### Spacing
```css
.m-4    /* margin: 16px */
.mt-2   /* margin-top: 8px */
.mb-4   /* margin-bottom: 16px */
.p-4    /* padding: 16px */
.px-3   /* padding-left & right: 12px */
.py-2   /* padding-top & bottom: 8px */
.gap-3  /* gap: 12px */
```

### Shadows
```css
.shadow-sm, .shadow-md, .shadow-lg
.shadow-coffee, .shadow-success
```

### Borders
```css
.rounded, .rounded-lg, .rounded-full
.border-coffee, .border-left-coffee
```

### Typography
```css
.text-sm, .text-lg, .text-2xl
.font-bold, .font-semibold
.text-center, .text-left
```

### Flexbox
```css
.d-flex, .flex-column
.justify-center, .justify-between
.items-center, .items-start
```

### Grid
```css
.d-grid
.grid-cols-2, .grid-cols-3
```

---

## 📱 Breakpoints

```css
/* Mobile First */
Base:        0px - 575px
Tablet:    576px - 767px
Desktop:  1024px+

@media (min-width: 576px) { /* Small tablets */ }
@media (min-width: 768px) { /* Tablets */ }
@media (min-width: 1024px) { /* Desktop */ }
```

---

## 🎯 Component Patterns

### Search Bar
```css
.search-bar {
  position: relative;
  margin: var(--spacing-4) 0;
}

.search-bar input {
  padding: var(--spacing-3) var(--spacing-12) var(--spacing-3) var(--spacing-5);
  border-radius: var(--radius-full);
  border: 2px solid var(--searchbar-border-color);
}
```

### Stat Card
```css
.stat-card {
  background: var(--stat-card-bg);
  color: var(--stat-card-text);
  border-radius: var(--radius-lg);
  padding: var(--spacing-5) var(--spacing-4);
  box-shadow: var(--stat-card-shadow);
}
```

### Button
```css
.btn-primary {
  background: var(--stat-card-bg);
  color: var(--color-white);
  padding: var(--button-padding-y) var(--button-padding-x);
  border-radius: var(--button-border-radius);
}
```

### Card
```css
.card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  box-shadow: var(--card-shadow);
}
```

---

## ✅ Quick Checklist

- [ ] Import design-tokens.css?
- [ ] No hard-coded colors?
- [ ] No hard-coded spacing?
- [ ] Responsive design?
- [ ] Hover states defined?
- [ ] Focus states for accessibility?
- [ ] Using CSS variables?
- [ ] Coffee theme consistent?

---

## 🚫 Don't Do This

```css
/* ❌ Wrong */
.button {
  background: #8B4513;
  padding: 16px;
  border-radius: 8px;
}

/* ✅ Right */
.button {
  background: var(--color-primary);
  padding: var(--spacing-4);
  border-radius: var(--radius-md);
}
```

---

## 📚 Files to Reference

1. **design-tokens.css** - All variables
2. **utilities.css** - Helper classes
3. **visual-consistency-guide.css** - Full documentation
4. **VISUAL_CONSISTENCY_IMPROVEMENTS.md** - Complete guide

---

**Last Updated**: January 21, 2026  
**Version**: 1.0.0  
**Coffee Shop POS** ☕✨
