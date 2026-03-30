"use client";

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none text-sm text-foreground">
              <p>
                SalinDugo collects and uses personal data to provide and improve
                services such as donor-recipient matching and forecasting. We
                retain only the data necessary for service delivery and follow
                standard security practices.
              </p>
              <h4>What we collect</h4>
              <ul>
                <li>Contact information (name, email, phone)</li>
                <li>Blood type and donation history</li>
                <li>Location data when enabled</li>
              </ul>
              <h4>How we use data</h4>
              <p>
                Data is used to match donors, coordinate requests, and generate
                forecasts. We may share aggregated, non-identifying statistics
                for research or reporting.
              </p>
              <h4>Your rights</h4>
              <p>
                You can request access to or deletion of your personal data by
                contacting support. We will respond according to applicable
                laws.
              </p>
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
