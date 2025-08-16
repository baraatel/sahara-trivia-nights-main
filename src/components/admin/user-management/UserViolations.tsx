
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { AlertTriangle, Plus } from "lucide-react";

interface Violation {
  id: string;
  violation_type: string;
  description: string;
  severity: string;
  is_resolved: boolean;
  created_at: string;
  resolved_at?: string;
  action_taken?: string;
}

interface UserViolationsProps {
  userId: string;
  onViolationUpdated: () => void;
}

const UserViolations = ({ userId, onViolationUpdated }: UserViolationsProps) => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchViolations();
  }, [userId]);

  const fetchViolations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_violations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setViolations(data || []);
    } catch (error) {
      console.error('Error fetching violations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch violations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'low':
        return <Badge className="bg-yellow-100 text-yellow-800">Low</Badge>;
      case 'medium':
        return <Badge className="bg-orange-100 text-orange-800">Medium</Badge>;
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High</Badge>;
      default:
        return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Violations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded">
                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse" />
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Violations</CardTitle>
          <Button size="sm" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Violation
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {violations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">No violations recorded</h3>
            <p>This user has a clean record.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {violations.map((violation) => (
                <TableRow key={violation.id}>
                  <TableCell>
                    <Badge variant="outline">{violation.violation_type}</Badge>
                  </TableCell>
                  <TableCell>
                    {getSeverityBadge(violation.severity)}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={violation.description}>
                      {violation.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    {violation.is_resolved ? (
                      <Badge className="bg-green-100 text-green-800">Resolved</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">Open</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(violation.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default UserViolations;
