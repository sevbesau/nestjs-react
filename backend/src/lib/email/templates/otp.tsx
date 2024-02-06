import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

import { EmailTemplate, EmailTemplateContext } from '.';

interface OtpEmailTemplateProps {
  otp: string;
}

export const otpTemplate = new EmailTemplate(
  ({ i18n, lang }) => i18n.t('emails.otp.SUBJECT', { lang }),
  (
    { otp }: OtpEmailTemplateProps,
    { configService, i18n, lang }: EmailTemplateContext,
  ) => {
    const baseUrl = configService.getOrThrow('BASE_URL');

    return (
      <Html>
        <Head />
        <Preview>{i18n.t('emails.otp.PREVIEW', { lang })}</Preview>
        <Body style={main}>
          <Container style={container}>
            <Section style={logoContainer}>
              <Img
                src={`${baseUrl}/static/logo.png`}
                width="64"
                height="64"
                alt={configService.getOrThrow('API_NAME')}
              />
            </Section>
            <Heading style={h1}>
              {i18n.t('emails.otp.HEADING', { lang })}
            </Heading>
            <Text style={heroText}>{i18n.t('emails.otp.BODY', { lang })}</Text>

            <Section style={codeBox}>
              <Text style={confirmationCodeText}>{`${otp.slice(
                0,
                3,
              )}-${otp.slice(3)}`}</Text>
            </Section>

            <Text style={text}>
              {i18n.t('emails.otp.DID_NOT_REQUEST', { lang })}
            </Text>

            <Section>
              <Row style={footerLogos}>
                <Column style={{ width: '66%' }}>
                  <Img
                    src={`${baseUrl}/static/logo.png`}
                    width="36"
                    height="36"
                    alt={configService.getOrThrow('API_NAME')}
                  />
                </Column>
                <Column>
                  <Row>
                    <Column>
                      <Link href="/">
                        <Img
                          src={`${baseUrl}/static/facebook.png`}
                          width="32"
                          height="32"
                          alt="Facebook"
                          style={socialMediaIcon}
                        />
                      </Link>
                    </Column>
                    <Column>
                      <Link href="/">
                        <Img
                          src={`${baseUrl}/static/facebook.png`}
                          width="32"
                          height="32"
                          alt="Instagram"
                          style={socialMediaIcon}
                        />
                      </Link>
                    </Column>
                    <Column>
                      <Link href="/">
                        <Img
                          src={`${baseUrl}/static/linkedin.png`}
                          width="32"
                          height="32"
                          alt="Linkedin"
                          style={socialMediaIcon}
                        />
                      </Link>
                    </Column>
                  </Row>
                </Column>
              </Row>
            </Section>

            <Section>
              <Link
                style={footerLink}
                href=""
                target="_blank"
                rel="noopener noreferrer"
              >
                {i18n.t('emails.POLICIES', { lang })}
              </Link>
              &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
              <Link
                style={footerLink}
                href=""
                target="_blank"
                rel="noopener noreferrer"
              >
                {i18n.t('emails.HELP_CENTER', { lang })}
              </Link>
              <Text style={footerText}>
                {/* TODO: copyright */}
                ©2023 TeamTopologies. <br />
                {/* TODO: address */}
                Jan peetersstraat 3, 2100 Antwerpen <br />
                <br />
                {i18n.t('emails.ALL_RIGHTS_RESERVED', { lang })}
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    );
  },
);

export default otpTemplate;

const footerText = {
  fontSize: '12px',
  color: '#b7b7b7',
  lineHeight: '15px',
  textAlign: 'left' as const,
  marginBottom: '50px',
};

const footerLink = {
  color: '#b7b7b7',
  textDecoration: 'underline',
};

const footerLogos = {
  marginBottom: '32px',
  paddingLeft: '8px',
  paddingRight: '8px',
  width: '100%',
};

const socialMediaIcon = {
  display: 'inline',
  marginLeft: '32px',
};

const main = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const container = {
  maxWidth: '600px',
  margin: '0 auto',
};

const logoContainer = {
  marginTop: '32px',
};

const h1 = {
  color: '#1d1c1d',
  fontSize: '36px',
  fontWeight: '700',
  margin: '30px 0',
  padding: '0',
  lineHeight: '42px',
};

const heroText = {
  fontSize: '20px',
  lineHeight: '28px',
  marginBottom: '30px',
};

const codeBox = {
  background: 'rgb(245, 244, 245)',
  borderRadius: '4px',
  marginRight: '50px',
  marginBottom: '30px',
  padding: '43px 23px',
};

const confirmationCodeText = {
  fontSize: '30px',
  textAlign: 'center' as const,
  verticalAlign: 'middle',
};

const text = {
  color: '#000',
  fontSize: '14px',
  lineHeight: '24px',
};
