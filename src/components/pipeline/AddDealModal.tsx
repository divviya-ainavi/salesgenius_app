import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Textarea } from "@/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { DealStage } from "@/types/pipeline";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui/form";
import { Calendar } from "@/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { mockCompanies, mockContacts } from "@/lib/mockContacts";
import { toast } from "sonner";

interface AddDealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AddDealFormData) => void;
}

export interface AddDealFormData {
  stage: DealStage;
  dealName?: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  dealValue?: number;
  leadSource?: string;
  appointmentDate?: Date;
  meetingType?: string;
  calendarIntegrated?: boolean;
  painPoints?: string;
  budgetRange?: string;
  decisionTimeline?: Date;
  notes?: string;
}

const formSchema = z.object({
  stage: z.enum(['leads', 'appointment-set', 'qualified', 'presentation', 'proposal-sent', 'negotiation-started']),
  dealName: z.string().trim().min(1, "Deal name is required").max(100, "Deal name must be less than 100 characters"),
  companyName: z.string().min(1, "Company name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().email("Valid email required").optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  dealValue: z.number().optional(),
  leadSource: z.string().optional(),
  appointmentDate: z.date().optional(),
  meetingType: z.string().optional(),
  calendarIntegrated: z.boolean().optional(),
  painPoints: z.string().optional(),
  budgetRange: z.string().optional(),
  decisionTimeline: z.date().optional(),
  notes: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

export const AddDealModal = ({ open, onOpenChange, onSubmit }: AddDealModalProps) => {
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string | null>(null);
  const [availableContacts, setAvailableContacts] = React.useState<typeof mockContacts>([]);
  const [showAddContactButton, setShowAddContactButton] = React.useState(false);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      stage: 'leads',
      dealName: '',
      companyName: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      dealValue: undefined,
      leadSource: undefined,
      notes: '',
    },
  });

  const selectedStage = form.watch('stage');

  const handleSubmit = (data: FormSchema) => {
    onSubmit(data as AddDealFormData);
    form.reset();
    setSelectedCompanyId(null);
    setAvailableContacts([]);
    setShowAddContactButton(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Deal</DialogTitle>
          <DialogDescription>
            Enter deal information. Required fields vary by stage.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Stage Selector */}
            <FormField
              control={form.control}
              name="stage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pipeline Stage *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="leads">🎯 Leads</SelectItem>
                      <SelectItem value="appointment-set">📅 Appointment Set</SelectItem>
                      <SelectItem value="qualified">✅ Qualified</SelectItem>
                      <SelectItem value="presentation">🎤 Presentation</SelectItem>
                      <SelectItem value="proposal-sent">📝 Proposal Sent</SelectItem>
                      <SelectItem value="negotiation-started">🤝 Negotiation Started</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Deal Name */}
            <FormField
              control={form.control}
              name="dealName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deal Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Enterprise Upgrade, Q1 Expansion" {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Basic Info - All Stages */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <Select 
                      onValueChange={(companyId) => {
                        const company = mockCompanies.find(c => c.id === companyId);
                        if (company) {
                          field.onChange(company.name);
                          setSelectedCompanyId(companyId);
                          
                          // Find contacts at this company
                          const contacts = mockContacts.filter(c => c.currentCompanyId === companyId);
                          setAvailableContacts(contacts);
                          
                          // Auto-populate first contact if only one exists
                          if (contacts.length === 1) {
                            form.setValue('contactName', contacts[0].name);
                            form.setValue('contactEmail', contacts[0].email || '');
                            form.setValue('contactPhone', contacts[0].phone || '');
                            setShowAddContactButton(false);
                          } else if (contacts.length === 0) {
                            // No contacts, show add button
                            setShowAddContactButton(true);
                            form.setValue('contactName', '');
                            form.setValue('contactEmail', '');
                            form.setValue('contactPhone', '');
                          } else {
                            // Multiple contacts, let user choose
                            setShowAddContactButton(false);
                            form.setValue('contactName', '');
                            form.setValue('contactEmail', '');
                            form.setValue('contactPhone', '');
                          }
                        }
                      }}
                      value={selectedCompanyId || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockCompanies.map(company => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name} {company.location && `• ${company.location}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name *</FormLabel>
                    {availableContacts.length > 1 ? (
                      <Select 
                        onValueChange={(contactId) => {
                          const contact = mockContacts.find(c => c.id === contactId);
                          if (contact) {
                            field.onChange(contact.name);
                            form.setValue('contactEmail', contact.email || '');
                            form.setValue('contactPhone', contact.phone || '');
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select contact" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableContacts.map(contact => (
                            <SelectItem key={contact.id} value={contact.id}>
                              {contact.name} • {contact.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <FormControl>
                        <Input 
                          placeholder="John Smith" 
                          {...field} 
                          disabled={availableContacts.length === 1}
                        />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {showAddContactButton && (
              <div className="col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
                  onClick={() => {
                    toast.info('Contact creation from deal form - coming soon!');
                    setShowAddContactButton(false);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Contact at {form.watch('companyName')}
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@acme.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+44 20 1234 5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dealValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Value (£)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="50000" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedStage === 'leads' && (
                <FormField
                  control={form.control}
                  name="leadSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead Source</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Website">Website</SelectItem>
                          <SelectItem value="Referral">Referral</SelectItem>
                          <SelectItem value="Event">Event</SelectItem>
                          <SelectItem value="Cold Outreach">Cold Outreach</SelectItem>
                          <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                          <SelectItem value="Partner">Partner</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Appointment-Specific Fields */}
            {(selectedStage === 'appointment-set' || selectedStage === 'qualified') && (
              <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-sm">Appointment Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="appointmentDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Meeting Date/Time *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="meetingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meeting Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Discovery">Discovery</SelectItem>
                            <SelectItem value="Demo">Demo</SelectItem>
                            <SelectItem value="Follow-up">Follow-up</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Qualified+ Fields */}
            {(selectedStage === 'qualified' || selectedStage === 'presentation' || 
              selectedStage === 'proposal-sent' || selectedStage === 'negotiation-started') && (
              <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-sm">Qualification Details</h3>
                <FormField
                  control={form.control}
                  name="painPoints"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pain Points</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="List key challenges and pain points..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="budgetRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget Range</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select range" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="<50K">Less than £50K</SelectItem>
                            <SelectItem value="50K-100K">£50K - £100K</SelectItem>
                            <SelectItem value="100K-500K">£100K - £500K</SelectItem>
                            <SelectItem value="500K+">£500K+</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="decisionTimeline"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Decision Timeline</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : <span>Expected date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Notes - All Stages */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[hsl(var(--peregrine-blue))] hover:bg-[hsl(var(--peregrine-blue))]/90">
                Create Deal
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
