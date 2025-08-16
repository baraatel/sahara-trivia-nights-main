
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  UserX, 
  UserCheck, 
  AlertTriangle, 
  Download,
  Shield
} from "lucide-react";

interface BulkActionsModalProps {
  selectedUserIds: string[];
  open: boolean;
  onClose: () => void;
  onActionCompleted: () => void;
}

const BulkActionsModal = ({ selectedUserIds, open, onClose, onActionCompleted }: BulkActionsModalProps) => {
  const [activeTab, setActiveTab] = useState("delete");
  const [loading, setLoading] = useState(false);
  const [violationType, setViolationType] = useState("");
  const [violationDescription, setViolationDescription] = useState("");
  const [violationSeverity, setViolationSeverity] = useState("medium");
  const { toast } = useToast();

  const handleDeleteUsers = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Delete users
      const { error } = await supabase
        .from('users')
        .delete()
        .in('id', selectedUserIds);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        p_admin_id: user.id,
        p_action_type: 'bulk_delete_users',
        p_target_type: 'bulk_users',
        p_target_id: selectedUserIds[0],
        p_details: {
          user_count: selectedUserIds.length,
          deleted_user_ids: selectedUserIds
        }
      });

      toast({
        title: "Success",
        description: `${selectedUserIds.length} user(s) deleted successfully`,
      });

      onActionCompleted();
    } catch (error) {
      console.error('Error deleting users:', error);
      toast({
        title: "Error",
        description: "Failed to delete users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecordViolations = async () => {
    if (!violationType || !violationDescription) {
      toast({
        title: "Error",
        description: "Please fill in all violation fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create violations for all selected users
      const violations = selectedUserIds.map(userId => ({
        user_id: userId,
        violation_type: violationType,
        description: violationDescription,
        severity: violationSeverity,
        created_by: user.id,
      }));

      const { error } = await supabase
        .from('user_violations')
        .insert(violations);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        p_admin_id: user.id,
        p_action_type: 'bulk_record_violations',
        p_target_type: 'bulk_users',
        p_target_id: selectedUserIds[0],
        p_details: {
          user_count: selectedUserIds.length,
          violation_type: violationType,
          severity: violationSeverity
        }
      });

      toast({
        title: "Success",
        description: `Violations recorded for ${selectedUserIds.length} user(s)`,
      });

      onActionCompleted();
    } catch (error) {
      console.error('Error recording violations:', error);
      toast({
        title: "Error",
        description: "Failed to record violations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportUsers = async () => {
    try {
      setLoading(true);

      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .in('id', selectedUserIds);

      if (error) throw error;

      // Convert to CSV
      const csvHeaders = ['Email', 'Full Name', 'Username', 'Created At'];
      const csvRows = users.map(user => [
        user.email,
        user.full_name,
        user.username,
        new Date(user.created_at).toLocaleString()
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `Exported ${selectedUserIds.length} user(s) to CSV`,
      });

      onActionCompleted();
    } catch (error) {
      console.error('Error exporting users:', error);
      toast({
        title: "Error",
        description: "Failed to export users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setViolationType("");
    setViolationDescription("");
    setViolationSeverity("medium");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Bulk Actions for {selectedUserIds.length} User{selectedUserIds.length > 1 ? 's' : ''}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="delete" className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Delete
            </TabsTrigger>
            <TabsTrigger value="violations" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Violations
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="suspend" className="flex items-center gap-2">
              <UserX className="h-4 w-4" />
              Suspend
            </TabsTrigger>
          </TabsList>

          <TabsContent value="delete" className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                <h3 className="font-medium text-red-800">Delete Users</h3>
              </div>
              <p className="text-sm text-red-700 mb-3">
                This action will permanently delete {selectedUserIds.length} user(s) and all their associated data. This cannot be undone.
              </p>
              <Badge variant="destructive">Permanent Action</Badge>
            </div>
            <Button 
              onClick={handleDeleteUsers} 
              disabled={loading}
              variant="destructive"
              className="w-full"
            >
              {loading ? "Deleting..." : `Delete ${selectedUserIds.length} User(s)`}
            </Button>
          </TabsContent>

          <TabsContent value="violations" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="violation-type">Violation Type</Label>
                <Select value={violationType} onValueChange={setViolationType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select violation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spam">Spam</SelectItem>
                    <SelectItem value="harassment">Harassment</SelectItem>
                    <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                    <SelectItem value="cheating">Cheating</SelectItem>
                    <SelectItem value="abuse">Abuse</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="violation-severity">Severity</Label>
                <Select value={violationSeverity} onValueChange={setViolationSeverity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="violation-description">Description</Label>
                <Textarea
                  id="violation-description"
                  placeholder="Describe the violation..."
                  value={violationDescription}
                  onChange={(e) => setViolationDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <Button 
              onClick={handleRecordViolations} 
              disabled={loading || !violationType || !violationDescription}
              className="w-full"
            >
              {loading ? "Recording..." : `Record Violation for ${selectedUserIds.length} User(s)`}
            </Button>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Download className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium text-blue-800">Export Users</h3>
              </div>
              <p className="text-sm text-blue-700">
                Export selected users data to a CSV file for external processing or backup.
              </p>
            </div>
            <Button 
              onClick={handleExportUsers} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? "Exporting..." : `Export ${selectedUserIds.length} User(s) to CSV`}
            </Button>
          </TabsContent>

          <TabsContent value="suspend" className="space-y-4">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <UserX className="h-5 w-5 text-orange-600" />
                <h3 className="font-medium text-orange-800">Suspend Users</h3>
              </div>
              <p className="text-sm text-orange-700">
                This feature is coming soon. Users will be temporarily suspended from accessing the platform.
              </p>
            </div>
            <Button disabled variant="outline" className="w-full">
              Coming Soon
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkActionsModal;
