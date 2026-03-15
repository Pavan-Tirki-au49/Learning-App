"use client";
import React, { useEffect, useState } from "react";
import { AuthGuard } from "@/components/Auth/AuthGuard";
import apiClient from "@/lib/apiClient";
import { Spinner } from "@/components/common/Spinner";
import { Award, Download, Calendar, ArrowLeft } from "lucide-react";
import Link from 'next/link';

interface Certificate {
  id: number;
  subject_id: number;
  subject_title: string;
  issued_at: string;
}

export default function CertificatesPage() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null);

  useEffect(() => {
    const fetchCerts = async () => {
      try {
        const { data } = await apiClient.get("/certificates");
        setCerts(data);
      } catch (err) {
        console.error("Error fetching certificates:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCerts();
  }, []);

  const handleDownload = async (subjectId: number, title: string) => {
    setDownloading(subjectId);
    try {
      const response = await apiClient.get(`/certificates/${subjectId}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Certificate-${title.replace(/\s+/g, '-')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      alert("Failed to download certificate. Make sure you completed all lessons!");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-sans w-full">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/profile" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">My Certificates</h1>
            <p className="text-slate-500 font-medium">Download your earned certificates of completion</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : certs.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-3xl p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border mb-4">
              <Award className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No certificates earned yet</h3>
            <p className="text-slate-500 max-w-sm mb-6 leading-relaxed">
              Complete any full course to 100% to unlocked printable high-grade qualifications dashboard certificates.
            </p>
            <Link href="/subjects" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl shadow-md">
              Start Studying
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certs.map((cert) => (
              <div key={cert.id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 mb-2 leading-snug">{cert.subject_title}</h3>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-6">
                    <Calendar className="w-4 h-4" /> Earned {new Date(cert.issued_at).toLocaleDateString()}
                  </p>
                </div>
                
                <button
                  onClick={() => handleDownload(cert.subject_id, cert.subject_title)}
                  disabled={downloading === cert.subject_id}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors active:scale-95"
                >
                  {downloading === cert.subject_id ? (
                    <Spinner />
                  ) : (
                    <><Download className="w-5 h-5" /> Download PDF</>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
