<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Gringotts - Bóveda Lestrange</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>%F0%9F%8F%A6</text></svg>" />
    <link rel="stylesheet" href="flags.css">
</head>
<body class="boveda">

    <!-- Capas de ambiente -->
    <div class="cielo" aria-hidden="true"></div>
    <div class="luna" aria-hidden="true"></div>
    <div class="niebla" aria-hidden="true"></div>
    <div class="brasas" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>

    <main class="envoltura">
        <section class="tarjeta pantalla">
            <div class="crest" aria-hidden="true">🔐</div>

            <h1>Bóveda de los Lestrange</h1>
            <p class="susurro">Las puertas de Gringotts solo ceden ante quien demuestra el rango adecuado.</p>

            <div class="runa" aria-hidden="true">✦ ⚜ ✦</div>

            <!-- Salida del guardián de la bóveda (lógica intacta) -->
            <div class="veredicto">
            <?php
            if ($_SERVER["REQUEST_METHOD"] == "POST") {
                $rol_usuario = $_POST['role'] ?? '';

                if ($rol_usuario === 'admin') {
                    echo "<h2>¡Bóveda Abierta!</h2>";
                    echo "<p>El hechizo grabado en la copa es: <b>Imperio</b></p>";
                } else {
                    echo "<h2>Acceso Denegado</h2>";
                    echo "<p>Rol detectado: " . htmlspecialchars($rol_usuario) . "</p>";
                }
            }
            ?>
            </div>

            <form method="POST" action="vault.php" class="conjuro">
                <p>Solicitar evaluación de acceso:</p>
                <input type="hidden" name="role" value="guest">
                <input type="submit" class="btn-magico" value="Intentar Entrar">
            </form>

            <p class="nota-pie"><a href="index.html">← Volver al vestíbulo</a></p>
        </section>
    </main>

</body>
</html>
