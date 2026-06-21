"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Checkbox } from "@workspace/ui/components/checkbox";

const MS_PER_HOUR = 3600000;

const DAYS_OF_WEEK = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

export const SlaSettingsView = () => {
  const config = useQuery(api.private.sla.getConfig);
  const upsertConfig = useMutation(api.private.sla.upsertConfig);

  const [firstResponseHours, setFirstResponseHours] = useState<string>("4");
  const [resolutionHours, setResolutionHours] = useState<string>("24");
  const [businessHoursStart, setBusinessHoursStart] = useState<string>("9");
  const [businessHoursEnd, setBusinessHoursEnd] = useState<string>("17");
  const [businessDays, setBusinessDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [timezone, setTimezone] = useState<string>("America/New_York");
  
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when config loads
  useEffect(() => {
    if (config) {
      setFirstResponseHours((config.firstResponseTargetMs / MS_PER_HOUR).toString());
      setResolutionHours((config.resolutionTargetMs / MS_PER_HOUR).toString());
      setBusinessHoursStart(config.businessHoursStart.toString());
      setBusinessHoursEnd(config.businessHoursEnd.toString());
      setBusinessDays(config.businessDays);
      setTimezone(config.timezone);
    }
  }, [config]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await upsertConfig({
        firstResponseTargetMs: parseFloat(firstResponseHours) * MS_PER_HOUR,
        resolutionTargetMs: parseFloat(resolutionHours) * MS_PER_HOUR,
        businessHoursStart: parseInt(businessHoursStart),
        businessHoursEnd: parseInt(businessHoursEnd),
        businessDays,
        timezone,
      });
      toast.success("SLA configuration saved");
    } catch (err: any) {
      toast.error(`Failed to save: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDay = (dayValue: number) => {
    setBusinessDays((prev) =>
      prev.includes(dayValue)
        ? prev.filter((d) => d !== dayValue)
        : [...prev, dayValue].sort()
    );
  };

  return (
    <div className="space-y-6">
      <Card className="bg-surface-container border-outline-variant">
        <CardHeader>
          <CardTitle className="text-on-surface">Response Targets</CardTitle>
          <CardDescription className="text-on-surface-variant">
            Set the maximum allowed time for agents to respond and resolve conversations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-on-surface">First Response Time (Hours)</Label>
              <Input
                type="number"
                min="0.5"
                step="0.5"
                value={firstResponseHours}
                onChange={(e) => setFirstResponseHours(e.target.value)}
                className="bg-surface border-outline-variant"
              />
              <p className="text-[12px] text-on-surface-variant">Time until the first human reply.</p>
            </div>
            <div className="space-y-2">
              <Label className="text-on-surface">Resolution Time (Hours)</Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={resolutionHours}
                onChange={(e) => setResolutionHours(e.target.value)}
                className="bg-surface border-outline-variant"
              />
              <p className="text-[12px] text-on-surface-variant">Time until the conversation is resolved.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-surface-container border-outline-variant">
        <CardHeader>
          <CardTitle className="text-on-surface">Business Hours</CardTitle>
          <CardDescription className="text-on-surface-variant">
            Define your team's working hours. SLAs will only count down during these times (Note: MVP SLA currently checks absolute time, business hours will be enforced in V2).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-on-surface">Start Hour (24h)</Label>
              <Input
                type="number"
                min="0"
                max="23"
                value={businessHoursStart}
                onChange={(e) => setBusinessHoursStart(e.target.value)}
                className="bg-surface border-outline-variant"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-on-surface">End Hour (24h)</Label>
              <Input
                type="number"
                min="1"
                max="24"
                value={businessHoursEnd}
                onChange={(e) => setBusinessHoursEnd(e.target.value)}
                className="bg-surface border-outline-variant"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-on-surface">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="bg-surface border-outline-variant">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                  <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-on-surface">Business Days</Label>
            <div className="flex flex-wrap gap-4">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={businessDays.includes(day.value)}
                    onCheckedChange={() => toggleDay(day.value)}
                    className="border-outline-variant data-[state=checked]:bg-primary"
                  />
                  <Label htmlFor={`day-${day.value}`} className="text-sm font-normal text-on-surface">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || config === undefined} className="w-32">
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
};
