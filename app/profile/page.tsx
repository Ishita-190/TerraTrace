'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { User, MapPin, Trees, Building, BookOpen, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string;
  survey_completed?: boolean;
  survey_data?: SurveyData;
}

interface SurveyData {
  location: {
    state: string;
    district: string;
    village: string;
    pincode: string;
  };
  nearby_infrastructure: {
    dams_nearby: string[];
    forests_nearby: string[];
    distance_to_dam: string;
    distance_to_forest: string;
  };
  awareness: {
    knows_citizen_laws: boolean;
    knows_compensation_rights: boolean;
    knows_rti_act: boolean;
    knows_environmental_laws: boolean;
    participated_in_activism: boolean;
    willing_to_participate: boolean;
  };
  impact_assessment: {
    directly_affected: boolean;
    family_affected: boolean;
    community_affected: boolean;
    impact_types: string[];
  };
  additional_info: string;
}

interface Complaint {
  id: string;
  title: string;
  category: string;
  status: string;
  createdAt: string;
  targetType: 'dam' | 'forest';
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [surveyLoading, setSurveyLoading] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyProgress, setSurveyProgress] = useState(0);
  
  // Survey form state
  const [surveyData, setSurveyData] = useState<SurveyData>({
    location: {
      state: '',
      district: '',
      village: '',
      pincode: ''
    },
    nearby_infrastructure: {
      dams_nearby: [],
      forests_nearby: [],
      distance_to_dam: '',
      distance_to_forest: ''
    },
    awareness: {
      knows_citizen_laws: false,
      knows_compensation_rights: false,
      knows_rti_act: false,
      knows_environmental_laws: false,
      participated_in_activism: false,
      willing_to_participate: false
    },
    impact_assessment: {
      directly_affected: false,
      family_affected: false,
      community_affected: false,
      impact_types: []
    },
    additional_info: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('tt_token');
    if (!token) {
      router.push('/login');
      return;
    }
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
    
    // Fetch user profile and complaints in parallel
    Promise.all([
      fetch(`${apiBase}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${apiBase}/complaints/user`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    ])
      .then(async ([profileRes, complaintsRes]) => {
        const profileData = await profileRes.json();
        const complaintsData = await complaintsRes.json();
        
        if (!profileRes.ok || !profileData.success) {
          // Don't immediately logout, check if it's a token issue
          if (profileRes.status === 401) {
            toast.error('Session expired. Please login again.');
            localStorage.removeItem('tt_token');
            router.push('/login');
            return;
          }
          throw new Error(profileData.error || 'Failed to fetch profile');
        }
        
        setUser(profileData.user);
        
        if (complaintsRes.ok && complaintsData.success) {
          setComplaints(complaints.data || []);
        }
        
        // Show survey if not completed
        if (!profileData.user.survey_completed) {
          setShowSurvey(true);
        }
      })
      .catch((err) => {
        console.error('Profile load error:', err);
        // Only logout on authentication errors, not network errors
        if (err.message?.includes('token') || err.message?.includes('401')) {
          toast.error('Session expired. Please login again.');
          localStorage.removeItem('tt_token');
          router.push('/login');
        } else {
          toast.error('Failed to load profile. Please try again.');
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('tt_token');
    toast.success('Logged out');
    router.push('/login');
  };

  const calculateProgress = () => {
    let filled = 0;
    let total = 0;
    
    // Location fields
    Object.values(surveyData.location).forEach(val => { if (val) filled++; });
    total += 4;
    
    // Infrastructure
    if (surveyData.nearby_infrastructure.dams_nearby.length > 0) filled++;
    if (surveyData.nearby_infrastructure.forests_nearby.length > 0) filled++;
    if (surveyData.nearby_infrastructure.distance_to_dam) filled++;
    if (surveyData.nearby_infrastructure.distance_to_forest) filled++;
    total += 4;
    
    // Awareness checkboxes
    Object.values(surveyData.awareness).forEach(val => { if (val) filled++; });
    total += 6;
    
    // Impact assessment
    Object.values(surveyData.impact_assessment.directly_affected ? [true] : surveyData.impact_assessment.impact_types).forEach(() => filled++);
    total += 1;
    
    if (surveyData.additional_info) filled++;
    total += 1;
    
    return Math.round((filled / total) * 100);
  };

  const handleSurveySubmit = async () => {
    setSurveyLoading(true);
    try {
      const token = localStorage.getItem('tt_token');
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
      
      const response = await fetch(`${apiBase}/auth/survey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(surveyData)
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit survey');
      }
      
      toast.success('Survey submitted successfully! Thank you for contributing.');
      setShowSurvey(false);
      setUser(prev => prev ? { ...prev, survey_completed: true, survey_data: surveyData } : null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit survey');
    } finally {
      setSurveyLoading(false);
    }
  };

  const updateSurveyData = (section: keyof SurveyData, field: string, value: any) => {
    setSurveyData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setSurveyProgress(calculateProgress());
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Profile Header */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{user?.name || 'User Profile'}</h1>
                <p className="text-muted-foreground">{user?.email}</p>
                {user?.created_at && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Member since {new Date(user.created_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleLogout}>Logout</Button>
              {!user?.survey_completed && (
                <Button onClick={() => setShowSurvey(true)}>Complete Survey</Button>
              )}
            </div>
          </div>
        </Card>

        {/* Survey Status */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user?.survey_completed ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <h3 className="font-medium">Survey Completed</h3>
                    <p className="text-sm text-muted-foreground">Thank you for contributing to the initiative</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <div>
                    <h3 className="font-medium">Survey Pending</h3>
                    <p className="text-sm text-muted-foreground">Help us strengthen the initiative with your data</p>
                  </div>
                </>
              )}
            </div>
            {user?.survey_completed && (
              <Button variant="outline" size="sm" onClick={() => setShowSurvey(true)}>
                View Responses
              </Button>
            )}
          </div>
        </Card>

        {/* Complaint History */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Complaint History</h2>
            <Badge variant="secondary">{complaints.length}</Badge>
          </div>
          
          {complaints.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No complaints submitted yet</p>
              <Button 
                variant="outline" 
                className="mt-3"
                onClick={() => router.push('/complaints')}
              >
                Submit Your First Complaint
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.slice(0, 5).map((complaint) => (
                <div key={complaint.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{complaint.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {complaint.targetType === 'dam' ? 'Dam' : 'Forest'} • {new Date(complaint.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={complaint.status === 'resolved' ? 'default' : 'secondary'}>
                      {complaint.status}
                    </Badge>
                    <Badge variant="outline">{complaint.category}</Badge>
                  </div>
                </div>
              ))}
              {complaints.length > 5 && (
                <Button variant="outline" className="w-full">
                  View All Complaints ({complaints.length - 5} more)
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* Survey Modal */}
        {showSurvey && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold">Contribute Your Data</h2>
                    <p className="text-muted-foreground">Help us strengthen the initiative with your information</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowSurvey(false)}>
                    ✕
                  </Button>
                </div>

                <Progress value={surveyProgress} className="mb-6" />
                <p className="text-sm text-muted-foreground mb-6">{surveyProgress}% Complete</p>

                <div className="space-y-6">
                  {/* Location Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold">Location Information</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">State</Label>
                        <Input 
                          value={surveyData.location.state}
                          onChange={(e) => updateSurveyData('location', 'state', e.target.value)}
                          placeholder="Your state"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">District</Label>
                        <Input 
                          value={surveyData.location.district}
                          onChange={(e) => updateSurveyData('location', 'district', e.target.value)}
                          placeholder="Your district"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Village/Town</Label>
                        <Input 
                          value={surveyData.location.village}
                          onChange={(e) => updateSurveyData('location', 'village', e.target.value)}
                          placeholder="Your village or town"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Pincode</Label>
                        <Input 
                          value={surveyData.location.pincode}
                          onChange={(e) => updateSurveyData('location', 'pincode', e.target.value)}
                          placeholder="6-digit pincode"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Infrastructure Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Building className="w-4 h-4 text-primary" />
                      <Trees className="w-4 h-4 text-green-600" />
                      <h3 className="font-semibold">Nearby Infrastructure</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm">Dams nearby (names if known)</Label>
                        <Input 
                          value={surveyData.nearby_infrastructure.dams_nearby.join(', ')}
                          onChange={(e) => updateSurveyData('nearby_infrastructure', 'dams_nearby', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                          placeholder="Dam names separated by commas"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Distance to nearest dam</Label>
                        <Select value={surveyData.nearby_infrastructure.distance_to_dam} onValueChange={(value) => updateSurveyData('nearby_infrastructure', 'distance_to_dam', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select distance" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="<5km">Less than 5km</SelectItem>
                            <SelectItem value="5-10km">5-10km</SelectItem>
                            <SelectItem value="10-25km">10-25km</SelectItem>
                            <SelectItem value="25-50km">25-50km</SelectItem>
                            <SelectItem value=">50km">More than 50km</SelectItem>
                            <SelectItem value="none">No dams nearby</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm">Forests nearby (names if known)</Label>
                        <Input 
                          value={surveyData.nearby_infrastructure.forests_nearby.join(', ')}
                          onChange={(e) => updateSurveyData('nearby_infrastructure', 'forests_nearby', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                          placeholder="Forest names separated by commas"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Distance to nearest forest</Label>
                        <Select value={surveyData.nearby_infrastructure.distance_to_forest} onValueChange={(value) => updateSurveyData('nearby_infrastructure', 'distance_to_forest', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select distance" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="<1km">Less than 1km</SelectItem>
                            <SelectItem value="1-5km">1-5km</SelectItem>
                            <SelectItem value="5-10km">5-10km</SelectItem>
                            <SelectItem value="10-25km">10-25km</SelectItem>
                            <SelectItem value=">25km">More than 25km</SelectItem>
                            <SelectItem value="none">No forests nearby</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Awareness Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold">Legal Awareness</h3>
                    </div>
                    <div className="space-y-3">
                      {Object.entries({
                        knows_citizen_laws: 'Aware of citizen protection laws related to dams/forests',
                        knows_compensation_rights: 'Know about compensation rights for affected people',
                        knows_rti_act: 'Familiar with RTI (Right to Information) Act',
                        knows_environmental_laws: 'Knowledge of environmental protection laws',
                        participated_in_activism: 'Participated in environmental/social activism',
                        willing_to_participate: 'Willing to participate in future initiatives'
                      }).map(([key, label]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox 
                            id={key}
                            checked={surveyData.awareness[key as keyof typeof surveyData.awareness]}
                            onCheckedChange={(checked) => updateSurveyData('awareness', key, checked)}
                          />
                          <Label htmlFor={key} className="text-sm">{label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Impact Assessment */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold">Impact Assessment</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="directly_affected"
                          checked={surveyData.impact_assessment.directly_affected}
                          onCheckedChange={(checked) => updateSurveyData('impact_assessment', 'directly_affected', checked)}
                        />
                        <Label htmlFor="directly_affected" className="text-sm">Directly affected by dam/forest projects</Label>
                      </div>
                      <div>
                        <Label className="text-sm">Types of impact experienced</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {['Displacement', 'Loss of livelihood', 'Environmental damage', 'Water scarcity', 'Health issues', 'Cultural impact'].map((impact) => (
                            <div key={impact} className="flex items-center space-x-2">
                              <Checkbox 
                                id={impact}
                                checked={surveyData.impact_assessment.impact_types.includes(impact)}
                                onCheckedChange={(checked) => {
                                  const current = surveyData.impact_assessment.impact_types;
                                  const updated = checked 
                                    ? [...current, impact]
                                    : current.filter(i => i !== impact);
                                  updateSurveyData('impact_assessment', 'impact_types', updated);
                                }}
                              />
                              <Label htmlFor={impact} className="text-sm">{impact}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div>
                    <Label className="text-sm">Additional Information</Label>
                    <Textarea 
                      value={surveyData.additional_info}
                      onChange={(e) => updateSurveyData('additional_info', 'additional_info', e.target.value)}
                      placeholder="Any other information you'd like to share..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setShowSurvey(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSurveySubmit} 
                    disabled={surveyLoading || surveyProgress < 50}
                    className="flex-1"
                  >
                    {surveyLoading ? 'Submitting...' : 'Submit Survey'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}