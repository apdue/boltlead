import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPage() {
  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <h2>1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us, including but not
            limited to your name, email address, phone number, and any other
            information you choose to provide.
          </p>

          <h2>2. How We Use Your Information</h2>
          <p>
            We use the information we collect to:
          </p>
          <ul>
            <li>Provide, maintain, and improve our services</li>
            <li>Process your transactions</li>
            <li>Send you technical notices and support messages</li>
            <li>Respond to your comments and questions</li>
            <li>Protect against fraud and abuse</li>
          </ul>

          <h2>3. Information Sharing</h2>
          <p>
            We do not share your personal information with third parties except as
            described in this privacy policy or with your consent.
          </p>

          <h2>4. Data Security</h2>
          <p>
            We take reasonable measures to help protect your personal information
            from loss, theft, misuse, unauthorized access, disclosure,
            alteration, and destruction.
          </p>

          <h2>5. Your Rights</h2>
          <p>
            You have the right to access, update, or delete your personal
            information. You can exercise these rights by contacting us.
          </p>

          <h2>6. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify
            you of any changes by posting the new privacy policy on this page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 