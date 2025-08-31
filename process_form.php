<?php
$recipient_email = "marian.wolf2008@gmail.com";

$message = "";
$message_type = "";

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    $name = trim($_POST['name'] ?? '');
    $email = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
    $user_message = trim($_POST['message'] ?? '');

    if (empty($name) || empty($email) || empty($user_message)) {
        $message = "Fehler: Bitte füllen Sie alle Felder aus.";
        $message_type = "error";
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $message = "Fehler: Die E-Mail-Adresse ist ungültig.";
        $message_type = "error";
    } else {

        $subject = "Neue Kontaktanfrage von " . $name;
        $headers = "From: " . $email . "\r\n";
        $headers .= "Reply-To: " . $email . "\r\n";
        $headers .= "Content-type: text/plain; charset=UTF-8\r\n";

        $email_content = "Name: " . $name . "\n";
        $email_content .= "E-Mail: " . $email . "\n\n";
        $email_content .= "Nachricht:\n" . $user_message . "\n";

        if (mail($recipient_email, $subject, $email_content, $headers)) {
            $message = "Ihre Nachricht wurde erfolgreich gesendet. Vielen Dank!";
            $message_type = "success";
        } else {
            $message = "Fehler: Die Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.";
            $message_type = "error";
        }
    }
} else {
    header("Location: index.html");
    exit;
}

include 'kontakt.html';
echo '<script>document.querySelector(".container").innerHTML += `<div class="message ' . $message_type . '">' . $message . '</div>`;</script>';

?>