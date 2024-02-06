import { Body, Head, Html, Preview } from '@react-email/components';
import * as React from 'react';

import { EmailTemplate, EmailTemplateContext } from '.';

interface TestTemplateProps {
  hello: string;
}

export const testTemplate = new EmailTemplate(
  () => 'subject',
  ({ hello }: TestTemplateProps, {}: EmailTemplateContext) => {
    return (
      <Html>
        <Head />
        <Preview>{hello}</Preview>
        <Body>{hello}</Body>
      </Html>
    );
  },
);

export default testTemplate;
