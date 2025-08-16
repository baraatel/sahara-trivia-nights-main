
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { AlertCircle } from "lucide-react";

interface IssueReport {
  id: string;
  issue_type: string;
  description: string;
  status: string;
  priority: string;
  reported_at: string;
  resolved_at?: string;
  admin_response?: string;
}

interface IssueReportsProps {
  userId: string;
}

const IssueReports = ({ userId }: IssueReportsProps) => {
  const [issueReports, setIssueReports] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchIssueReports();
  }, [userId]);

  const fetchIssueReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('issue_reports')
        .select('*')
        .eq('user_id', userId)
        .order('reported_at', { ascending: false });

      if (error) throw error;
      setIssueReports(data || []);
    } catch (error) {
      console.error('Error fetching issue reports:', error);
      toast({
        title: "Error",
        description: "Failed to fetch issue reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-red-100 text-red-800">Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>;
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Issue Reports</CardTitle>
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
        <CardTitle>Issue Reports</CardTitle>
      </CardHeader>
      <CardContent>
        {issueReports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">No issues reported</h3>
            <p>You haven't reported any issues yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reported</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issueReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <Badge variant="outline">{report.issue_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={report.description}>
                      {report.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getPriorityBadge(report.priority)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(report.status)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(report.reported_at), 'MMM dd, yyyy')}
                      <div className="text-gray-500">
                        {format(new Date(report.reported_at), 'HH:mm')}
                      </div>
                    </div>
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

export default IssueReports;
