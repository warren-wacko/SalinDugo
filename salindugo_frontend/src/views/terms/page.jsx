"use client";

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none text-sm text-foreground">
              <p>
                Welcome to SalinDugo. By using our services you agree to these
                Terms & Conditions. You must be at least 18 years old to use the
                platform. Your use of the service is subject to local laws and
                regulations. You agree not to misuse the platform or attempt to
                interfere with its operation.
              </p>
              <h4>Accounts</h4>
              <p>
                You are responsible for maintaining the security of your account
                and for all activities that occur under your account.
              </p>
              <h4>Data & Content</h4>
              <p>
                You grant us the right to store and process data you submit for
                the purpose of providing the service (matching, alerts,
                forecasts). We will not sell your personal data.
              </p>
              <h4>Limitation of Liability</h4>
              <p>
                The platform is provided "as is". SalinDugo is not liable for
                indirect, incidental, or consequential damages arising from use
                of the service.
              </p>
              <p className="mt-4">For full legal terms contact support.</p>
            </div>

            <div className="mt-6 flex justify-end">
              <Button asChild>
                <Link to="/">Back</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
