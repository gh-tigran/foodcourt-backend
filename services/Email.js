import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    secure: true,
    host: "smtp.mail.ru",
    port: 465,
    auth: {
        user: 'armmmartirosyann@mail.ru',
        pass: 'tkc3MHn5JM6dSWg05nNw',
    },
});

class Email {
    static sendActivationEmail(email, token, frontUrl) {
        return transporter.sendMail({
            from: '"Foodcourt" <armmmartirosyann@mail.ru>',
            to: email,
            subject: 'Активировать аккаунт',
            html: `<a 
                    href="${frontUrl}?email=${email}&token=${token}" 
                    style="display: inline-block; text-decoration: none; background-color: #d1d1d1; width: 100%; padding: 25px 15px; color: #161824; font-family: sans-serif; font-size: 16px; text-align: center"
                    >
                        Активировать аккаунт >
                    </a>`
        })
    }

    static sendPasswordChangeEmail(email, token) {
        return transporter.sendMail({
            from: '"Foodcourt" <armmmartirosyann@mail.ru>',
            to: email,
            subject: 'Ключ',
            html: `<div>Ключ - <b>${token}</b></div>`
        })
    }
}

export default Email
