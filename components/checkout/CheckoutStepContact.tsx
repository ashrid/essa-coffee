"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { checkoutContactSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CheckoutContactData = z.infer<typeof checkoutContactSchema>;

interface CheckoutStepContactProps {
  onNext: (data: CheckoutContactData) => void;
  defaultValues?: Partial<CheckoutContactData>;
}

export function CheckoutStepContact({
  onNext,
  defaultValues,
}: CheckoutStepContactProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutContactData>({
    resolver: zodResolver(checkoutContactSchema),
    defaultValues: {
      guestName: defaultValues?.guestName || "",
      guestEmail: defaultValues?.guestEmail || "",
      guestPhone: defaultValues?.guestPhone || "",
      guestNotes: defaultValues?.guestNotes || "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="guestName">
          Full Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="guestName"
          {...register("guestName")}
          placeholder="Essa Alshehhi"
          className={errors.guestName ? "border-red-500" : ""}
        />
        {errors.guestName && (
          <p className="text-sm text-red-500">{errors.guestName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="guestEmail">
          Email Address <span className="text-red-500">*</span>
        </Label>
        <Input
          id="guestEmail"
          type="email"
          {...register("guestEmail")}
          placeholder="example@email.com"
          className={errors.guestEmail ? "border-red-500" : ""}
        />
        {errors.guestEmail && (
          <p className="text-sm text-red-500">{errors.guestEmail.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="guestPhone">
          Phone Number <span className="text-sage-500">(optional)</span>
        </Label>
        <Input
          id="guestPhone"
          type="tel"
          {...register("guestPhone")}
          placeholder="05x 123 4567"
          className={errors.guestPhone ? "border-red-500" : ""}
        />
        {errors.guestPhone && (
          <p className="text-sm text-red-500">{errors.guestPhone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="guestNotes">
          Order Notes <span className="text-sage-500">(optional)</span>
        </Label>
        <Textarea
          id="guestNotes"
          {...register("guestNotes")}
          placeholder="Any special requests or notes"
          rows={4}
          className={errors.guestNotes ? "border-red-500" : ""}
        />
        {errors.guestNotes && (
          <p className="text-sm text-red-500">{errors.guestNotes.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-forest-600 hover:bg-forest-700 text-white"
        size="lg"
      >
        Continue to Payment &rarr;
      </Button>
    </form>
  );
}
