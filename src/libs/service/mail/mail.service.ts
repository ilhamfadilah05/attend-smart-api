import { Injectable } from '@nestjs/common';
import * as SendGrid from '@sendgrid/mail';
import { renderFile } from 'ejs';
import * as path from 'path';
import { ISendMail } from 'src/libs/interface';

@Injectable()
export class MailService {
  constructor() {
    SendGrid.setApiKey(process.env.SEND_GRID_KEY);
  }

  async sendTemplate(mail: ISendMail) {
    const finalPath = path.join(
      __dirname,
      '../../template',
      `template-${mail.template}.ejs`,
    );

    const html = await renderFile(finalPath, {
      ...mail.data,
      base_url: mail?.data?.base_url || process.env.BACKEND_URL,
    });

    return this.send({
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html,
    });
  }

  async send(mail: Omit<SendGrid.MailDataRequired, 'from'>) {
    const transport = await SendGrid.send({
      from: 'noreply@dompetdhuafa.org',
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      asm: mail.asm,
      attachments: mail.attachments,
      cc: mail.cc,
      bcc: mail.bcc,
      replyTo: mail.replyTo,
      personalizations: mail.personalizations,
      templateId: mail.templateId,
      dynamicTemplateData: mail.dynamicTemplateData,
      batchId: mail.batchId,
      categories: mail.categories,
      headers: mail.headers,
      trackingSettings: mail.trackingSettings,
      substitutionWrappers: mail.substitutionWrappers,
      sendAt: mail.sendAt,
      mailSettings: mail.mailSettings,
      customArgs: mail.customArgs,
      category: mail.category,
      content: mail.content,
      hideWarnings: mail.hideWarnings,
      isMultiple: mail.isMultiple,
      ipPoolName: mail.ipPoolName,
    });
    console.log(`E-Mail sent to ${mail.to}`);
    return transport;
  }
}
