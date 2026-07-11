import { test, expect } from '@playwright/test';

test('crear usuario en GESFUN', async ({ page }) => {
  const emailMicrosoft = process.env.PW_EMAIL;
  const passwordMicrosoft = process.env.PW_PASSWORD;

  if (!emailMicrosoft || !passwordMicrosoft) {
    test.skip(true, 'Configura PW_EMAIL y PW_PASSWORD para ejecutar esta prueba con Microsoft.');
  }

  // 1. Abrir GESFUN
  await page.goto('http://localhost:4200/login');

  // 2. Iniciar sesión con Microsoft
  await page
    .getByRole('button', {
      name: /iniciar sesi[oó]n con microsoft/i,
    })
    .click();

  await page
    .getByRole('textbox', {
      name: /email|phone/i,
    })
    .fill(emailMicrosoft);

  await page
    .getByRole('button', {
      name: /next|siguiente/i,
    })
    .click();

  await page
    .locator('input[type="password"]')
    .fill(passwordMicrosoft);

  await page
    .getByRole('button', {
      name: /sign in|iniciar sesi[oó]n/i,
    })
    .click();

  // 3. Responder pantalla "Stay signed in?"
  const noButton = page.getByRole('button', { name: /^no$/i });

  if (await noButton.isVisible({ timeout: 10_000 }).catch(() => false)) {
    await noButton.click();
  }

  // 4. Esperar el retorno desde Microsoft hacia GESFUN
  await page.waitForURL(
    url => url.origin === 'http://localhost:4200',
    { timeout: 30_000 }
  );

  // 5. Verificar que la interfaz autenticada está disponible
  const usuariosButton = page.getByRole('button', {
    name: /usuarios/i,
  });

  await expect(usuariosButton).toBeVisible({
    timeout: 15_000,
  });

  // 6. Ingresar al módulo Usuarios
  await usuariosButton.click();

  await page
    .getByRole('button', {
      name: /crear usuario/i,
    })
    .click();

  // 7. Completar formulario
  const textboxes = page.getByRole('textbox');
  const uniqueId = Date.now();

  await textboxes.nth(0).fill(`Juan ${uniqueId}`);
  await textboxes.nth(1).fill('Campos');
  await textboxes.nth(2).fill('E2E');

  // Correo diferente en cada ejecución para evitar duplicados
  const correoUsuario = `usuario.${uniqueId}@example.com`;

  await page
    .locator('input[type="email"]')
    .fill(correoUsuario);

  await textboxes.nth(4).fill('USER');
  await textboxes.nth(5).fill('USUARIO');

  const activoCheckbox = page.getByRole('checkbox', {
    name: /activo/i,
  });

  if (!(await activoCheckbox.isChecked())) {
    await activoCheckbox.check();
  }

  // 8. Guardar usuario
  await page
    .getByRole('button', {
      name: /^guardar$/i,
    })
    .click();

  // Ajustar al mensaje real que muestra GESFUN
  await expect(
    page.getByText(
      /usuario.*creado|usuario.*registrado|registrado correctamente/i
    )
  ).toBeVisible({
    timeout: 10_000,
  });

  // 9. Cerrar sesión
  await page
    .getByRole('button', {
      name: /cerrar sesi[oó]n/i,
    })
    .click();

  await expect(page).toHaveURL(/localhost:4200\/login/, {
    timeout: 15_000,
  });
});
