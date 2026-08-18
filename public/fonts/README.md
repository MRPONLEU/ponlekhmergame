# Custom Fonts

អ្នកអាចដាក់ឯកសារ font របស់អ្នក (ឧទាហរណ៍៖ .ttf, .woff, .woff2) នៅក្នុងថត (folder) នេះ។

ដើម្បីប្រើប្រាស់វានៅក្នុងកម្មវិធី អ្នកអាចបន្ថែមវានៅក្នុង CSS (ឧទាហរណ៍ នៅក្នុង \`src/index.css\`) ដូចខាងក្រោម៖

```css
@font-face {
  font-family: 'MyCustomFont';
  src: url('/fonts/my-custom-font.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}
```

បន្ទាប់មកអ្នកអាចហៅឈ្មោះ \`MyCustomFont\` មកប្រើប្រាស់បាន។
