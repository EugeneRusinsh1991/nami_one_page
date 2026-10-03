# Clean Starter Template (Next.js 15 + React 19)

Базовый чистый шаблон для быстрого старта разработки одностраничных и многостраничных веб-приложений. Шаблон не содержит специфичной бизнес-логики или стилизованного контента страниц — это готовый к работе технический фундамент.

---

## 🛠 Стек технологий

- **Фреймворк:** [Next.js 15](https://nextjs.org/) (App Router, React 19)
- **Язык:** [TypeScript 5.7](https://www.typescriptlang.org/)
- **Стилизация:** [Tailwind CSS v3.4](https://tailwindcss.com/) + PostCSS + `tailwindcss-animate`
- **Анимации и скролл:** [GSAP 3.12](https://greensock.com/gsap/) (`@gsap/react`), [Lenis](https://lenis.darkroom.engineering/) (Smooth Scroll Provider)
- **Иконки:** [Lucide React](https://lucide.dev/)

---

## 🧩 Встроенные UI-компоненты (Radix UI / shadcn base)

В папке `src/components/ui/` уже подключены и настроены базовые примитивы:

- **Кнопки & Бейджи:** `Button`, `Badge`
- **Карточки & Разделители:** `Card`, `Separator`
- **Модальные окна и панели:** `Dialog`, `Sheet`
- **Интерактивные элементы:** `Accordion`, `Tabs`, `DropdownMenu`
- **Формы и инпуты:** `Input`, `Textarea`, `Slider`
- **Индикаторы:** `Progress`

---

## 📂 Структура проекта

```text
├── public/                 # Статические ассеты (картинки, видео, лого)
├── src/
│   ├── app/                # Next.js App Router (layout.tsx, page.tsx, globals.css)
│   ├── components/
│   │   ├── providers/      # Провайдеры (Lenis smooth scroll)
│   │   └── ui/             # Базовые UI-примитивы
│   └── lib/                # Утилиты (cn / tailwind-merge, gsap registration)
├── components.json         # Конфигурация shadcn/ui
├── next.config.ts          # Конфигурация Next.js
├── tailwind.config.ts      # Конфигурация Tailwind CSS
└── tsconfig.json           # Конфигурация TypeScript
```

---

## 🚀 Быстрый старт

1. Установка зависимостей:
   ```bash
   npm install
   ```

2. Запуск локального сервера разработки:
   ```bash
   npm run dev
   ```
   Приложение будет доступно по адресу `http://localhost:3000`.

3. Сборка для продакшена:
   ```bash
   npm run build
   npm run start
   ```
