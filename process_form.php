<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    $name = trim(htmlspecialchars($_POST['name']));
    $email = trim(htmlspecialchars($_POST['email']));
    $message = trim(htmlspecialchars($_POST['message']));

    if (empty($name) || empty($email) || empty($message)) {
        echo "Ein oder mehrere Felder sind leer. Bitte füllen Sie das Formular vollständig aus.";
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo "Ungültiges E-Mail-Format. Bitte geben Sie eine gültige E-Mail-Adresse ein.";
    } else {
        $to = "marian.wolf@gmail.com";
        $subject = "Neue Nachricht von der Kontaktseite";
        $headers = "From: $name <$email>";

        $email_content = "Name: $name\n";
        $email_content .= "E-Mail: $email\n\n";
        $email_content .= "Nachricht:\n$message\n";

        if (mail($to, $subject, $email_content, $headers)) {
            header("Location: success.html");
            exit();
        } else {
            echo "Es ist ein Fehler beim Senden Ihrer Nachricht aufgetreten. Bitte versuchen Sie es später erneut.";
        }
    }
} else {
    echo "Ungültige Anfragemethode.";
}
?>