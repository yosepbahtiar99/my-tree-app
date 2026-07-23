# Responsive Screen Rules

## Mobile First

Always design and implement the UI using a **mobile-first approach**.

Target viewport order:

- 360px (Android)
- 375px
- 390px (iPhone)
- 640px
- 768px (Tablet)
- 1024px (Laptop)
- 1280px+
- 1536px+

Build the smallest layout first, then progressively enhance for larger screens.

---

## Breakpoints

Use Tailwind's default breakpoints.

```txt
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

Do not create desktop layouts before mobile layouts.

---

## Width

Prefer:

```jsx
w-full
max-w-*
min-w-0
```

Avoid:

```jsx
w-[1200px]
w-screen
min-w-[900px]
```

unless absolutely necessary.

---

## Overflow

The page must never have horizontal scrolling.

Always check for:

- overflowing flex items
- oversized images
- fixed widths
- long text
- tables

Use:

```jsx
overflow-x-auto
break-words
truncate
min-w-0
```

when needed.

---

## Flex & Grid

Mobile:

- Stack vertically.

Tablet/Desktop:

- Expand into rows or grids.

Example:

```jsx
grid-cols-1
sm:grid-cols-2
lg:grid-cols-3
```

or

```jsx
flex-col
lg:flex-row
```

---

## Images

Images must always be responsive.

```jsx
className="w-full h-auto object-cover"
```

Never allow images to overflow their container.

---

## Buttons

Buttons must be touch-friendly.

Minimum size:

- Height: 44px
- Width: 44px (tap target)

---

## Forms

Mobile:

Always use a single-column layout.

Desktop:

Can expand into multiple columns.

---

## Tables

Tables must not break the layout.

Use:

```jsx
overflow-x-auto
```

or convert to cards when appropriate.

---

## Typography

Text should scale naturally.

Example:

```jsx
text-sm md:text-base lg:text-lg
```

Avoid oversized text on mobile.

---

## Spacing

Use responsive spacing.

Example:

```jsx
px-4 md:px-6 lg:px-8

gap-4 md:gap-6

py-6 md:py-10
```

---

## Navigation

Desktop:

Horizontal navigation.

Mobile:

Drawer or hamburger menu.

Never shrink desktop navigation to fit mobile.

---

## Validation Checklist

Before returning any code, verify:

- ✅ Looks good at 360px
- ✅ Looks good at 390px
- ✅ Looks good at 768px
- ✅ Looks good at 1024px
- ✅ No horizontal scrolling
- ✅ No overflowing content
- ✅ Images resize correctly
- ✅ Cards stack correctly
- ✅ Buttons remain touch-friendly
- ✅ Forms remain usable
- ✅ Tables do not break the layout

If any item fails, fix it before returning the final code.