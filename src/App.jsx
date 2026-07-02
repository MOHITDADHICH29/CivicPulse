import { useEffect, useMemo, useState } from 'react';
import complaintData from '../data.json';

const severityStyles = {
  critical: { label: 'Critical', color: '#ef4444' },
  high: { label: 'High', color: '#f59e0b' },
  warning: { label: 'Warning', color: '#fbbf24' },
  stable: { label: 'Stable', color: '#10b981' },
};

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getSeverity(score) {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'warning';
  return 'stable';
}

function extractAreaNumber(value) {
  const normalized = normalizeText(value).toLowerCase();
  const match = normalized.match(/(?:community\s+area|area)\s*(\d+)/i);
  if (match) return match[1];
  const fallback = normalized.match(/\b(\d{1,3})\b/);
  return fallback ? fallback[1] : null;
}

function findZoneByArea(input, zones) {
  const areaNumber = extractAreaNumber(input);
  if (!areaNumber) return null;
  return zones.find((zone) => {
    const zoneLabel = `${zone.id}`.toLowerCase();
    const zoneName = zone.name.toLowerCase();
    return zoneLabel.includes(areaNumber) || zoneName.includes(areaNumber);
  }) || null;
}

function SeverityBarChart({ severityCounts, severityPercentages, zoneTotal }) {
  const severityOrder = ['critical', 'high', 'warning', 'stable'];

  return (
    <div className="health-graph-panel">
      <div className="health-graph-title">Severity distribution ({zoneTotal} areas)</div>
      <div className="health-bars">
        {severityOrder.map((key) => (
          <div key={key} className="health-bar-row">
            <span className="health-bar-label">{severityStyles[key].label}</span>
            <div className="health-bar-track">
              <div
                className="health-bar-fill"
                style={{
                  width: `${severityPercentages[key]}%`,
                  background: severityStyles[key].color,
                }}
              />
            </div>
            <span className="health-bar-value">{severityCounts[key]} ({severityPercentages[key]}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OpenClosedDonutChart({ openCount, closedCount, openPct, closedPct }) {
  const total = openCount + closedCount;
  const openAngle = total ? (openCount / total) * 360 : 0;

  return (
    <div className="health-graph-panel">
      <div className="health-graph-title">Open vs closed requests ({total} total)</div>
      <div className="health-donut-wrap">
        <div
          className="health-donut"
          style={{
            background: `conic-gradient(#38bdf8 0deg ${openAngle}deg, #10b981 ${openAngle}deg 360deg)`,
          }}
        >
          <div className="health-donut-center">
            <strong>{openPct}%</strong>
            <span>Open</span>
          </div>
        </div>
        <div className="health-donut-legend">
          <div className="health-legend-item">
            <span className="health-legend-dot open-dot" />
            <span>Open</span>
            <strong>{openCount}</strong>
            <em>{openPct}%</em>
          </div>
          <div className="health-legend-item">
            <span className="health-legend-dot closed-dot" />
            <span>Closed</span>
            <strong>{closedCount}</strong>
            <em>{closedPct}%</em>
          </div>
        </div>
      </div>
    </div>
  );
}

function CityHealthChart({ severityCounts, severityPercentages, zoneTotal, openCount, closedCount, openPct, closedPct, scoreHistory }) {
  return (
    <div className="health-chart">
      <SeverityBarChart
        severityCounts={severityCounts}
        severityPercentages={severityPercentages}
        zoneTotal={zoneTotal}
      />
      <OpenClosedDonutChart
        openCount={openCount}
        closedCount={closedCount}
        openPct={openPct}
        closedPct={closedPct}
      />
      <LineTrendChart points={scoreHistory} />
    </div>
  );
}

function LineTrendChart({ points }) {
  const width = 300;
  const height = 160;
  const pad = { top: 12, right: 12, bottom: 28, left: 36 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const yMin = 0;
  const yMax = 100;
  const yTicks = [0, 25, 50, 75, 100];

  const coords = points.map((value, index) => {
    const x = pad.left + (index / Math.max(points.length - 1, 1)) * chartW;
    const clamped = Math.min(yMax, Math.max(yMin, value));
    const y = pad.top + chartH - ((clamped - yMin) / (yMax - yMin)) * chartH;
    return { x, y, value: clamped };
  });

  const linePath = coords.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = coords.length
    ? `${linePath} L ${coords[coords.length - 1].x} ${pad.top + chartH} L ${coords[0].x} ${pad.top + chartH} Z`
    : '';

  if (!points.length) {
    return (
      <div className="health-graph-panel line-chart-panel">
        <div className="line-chart-header">
          <span>Live risk trend</span>
          <strong>Collecting data...</strong>
        </div>
      </div>
    );
  }

  return (
    <div className="health-graph-panel line-chart-panel">
      <div className="health-graph-title">Live risk trend</div>
      <div className="line-chart-header">
        <span>Avg risk score over time</span>
        <strong>{Number(points[points.length - 1]).toFixed(1)} / 100</strong>
      </div>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="line-chart-svg"
        aria-label="Live risk trend line graph"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="lineAreaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.35)" />
            <stop offset="100%" stopColor="rgba(56, 189, 248, 0.02)" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => {
          const y = pad.top + chartH - ((tick - yMin) / (yMax - yMin)) * chartH;
          return (
            <g key={tick}>
              <line
                x1={pad.left}
                y1={y}
                x2={pad.left + chartW}
                y2={y}
                className="line-chart-grid"
              />
              <text x={pad.left - 8} y={y + 4} className="line-chart-axis-label" textAnchor="end">
                {tick}
              </text>
            </g>
          );
        })}

        <line
          x1={pad.left}
          y1={pad.top + chartH}
          x2={pad.left + chartW}
          y2={pad.top + chartH}
          className="line-chart-axis"
        />
        <line
          x1={pad.left}
          y1={pad.top}
          x2={pad.left}
          y2={pad.top + chartH}
          className="line-chart-axis"
        />

        {coords.length > 1 && areaPath ? (
          <path d={areaPath} fill="url(#lineAreaGradient)" stroke="none" />
        ) : null}

        {coords.length > 1 ? (
          <path
            d={linePath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {coords.map((point, index) => (
          <g key={index}>
            <circle cx={point.x} cy={point.y} r="4" fill="#38bdf8" stroke="#0f172a" strokeWidth="2" />
            {(index === 0 || index === coords.length - 1) && (
              <text x={point.x} y={pad.top + chartH + 16} className="line-chart-axis-label" textAnchor="middle">
                {index === 0 ? 'Start' : 'Now'}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

function buildZoneMetrics(zones, zoneOverrides, resolvedZones) {
  return zones.map((zone) => {
    if (resolvedZones[zone.id]) {
      return {
        ...zone,
        complaints: 0,
        open: 0,
        unresolved: 0,
        growth: 0,
        score: 0,
        severity: 'stable',
        summary: 'This area has been cleared and no active problem remains.',
      };
    }

    const override = zoneOverrides[zone.id];
    if (override) {
      return {
        ...zone,
        ...override,
        severity: override.severity || getSeverity(override.score || zone.score),
        summary: override.summary || zone.summary,
      };
    }

    return {
      ...zone,
      summary: `${zone.topType} is still active in this area.`,
    };
  });
}

function computeRiskTrend(insights, zoneMetrics) {
  const health = computeCityHealth(insights, zoneMetrics);
  const topTen = [...zoneMetrics]
    .filter((zone) => zone.complaints > 0)
    .sort((a, b) => b.score - a.score || b.complaints - a.complaints)
    .slice(0, 10);
  const topTenAvg = topTen.reduce((sum, zone) => sum + zone.score, 0) / Math.max(topTen.length, 1);
  return Number((topTenAvg * 0.55 + health.openPct * 0.45).toFixed(1));
}

function applyRandomLiveUpdate(insights, resolvedZones, zoneOverrides) {
  const candidates = insights.zones.filter(
    (zone) => zone.complaints > 0 && !resolvedZones[zone.id],
  );

  if (!candidates.length) {
    const metrics = buildZoneMetrics(insights.zones, zoneOverrides, resolvedZones);
    return {
      nextOverrides: zoneOverrides,
      message: '',
      riskTrend: computeRiskTrend(insights, metrics),
    };
  }

  const randomZone = candidates[Math.floor(Math.random() * candidates.length)];
  const current = { ...randomZone, ...zoneOverrides[randomZone.id] };
  const pctDelta = 1 + Math.random() * 4;
  const scoreDelta = Math.max(1, Math.round(current.score * (pctDelta / 100)));
  const newScore = Math.min(100, current.score + scoreDelta);
  const complaints = current.complaints + Math.max(1, Math.round(current.complaints * (pctDelta / 100)));
  const open = current.open + Math.max(1, Math.round(current.open * (pctDelta / 100)));
  const unresolved = Math.min(100, Math.round((open / Math.max(complaints, 1)) * 100));
  const growth = Math.min(100, current.growth + Math.max(1, Math.round(current.growth * (pctDelta / 100))));

  const nextOverrides = {
    ...zoneOverrides,
    [randomZone.id]: {
      ...zoneOverrides[randomZone.id],
      complaints,
      open,
      unresolved,
      score: newScore,
      growth,
      severity: getSeverity(newScore),
      summary: `${randomZone.topType} shifted +${pctDelta.toFixed(1)}% in this area, updating score to ${newScore}.`,
    },
  };

  const metrics = buildZoneMetrics(insights.zones, nextOverrides, resolvedZones);

  return {
    nextOverrides,
    message: `${randomZone.name} updated +${pctDelta.toFixed(1)}% (score ${current.score} → ${newScore}).`,
    riskTrend: computeRiskTrend(insights, metrics),
  };
}

function computeCityHealth(insights, zoneMetrics) {
  let openCount = insights.openCount;
  let closedCount = insights.closedCount;

  insights.zones.forEach((baseZone) => {
    const liveZone = zoneMetrics.find((zone) => zone.id === baseZone.id);
    if (!liveZone) return;

    openCount += liveZone.open - baseZone.open;
    const baseClosed = Math.max(baseZone.complaints - baseZone.open, 0);
    const liveClosed = Math.max(liveZone.complaints - liveZone.open, 0);
    closedCount += liveClosed - baseClosed;
  });

  openCount = Math.max(0, openCount);
  closedCount = Math.max(0, closedCount);
  const totalRequests = openCount + closedCount;
  const openPct = totalRequests ? Math.round((openCount / totalRequests) * 100) : 0;
  const closedPct = totalRequests ? 100 - openPct : 0;

  const activeZones = zoneMetrics.filter((zone) => zone.complaints > 0);
  const zoneTotal = activeZones.length;
  const severityCounts = { critical: 0, high: 0, warning: 0, stable: 0 };
  const severityPercentages = { critical: 0, high: 0, warning: 0, stable: 0 };

  activeZones.forEach((zone) => {
    severityCounts[zone.severity] += 1;
  });

  const safeZoneTotal = Math.max(zoneTotal, 1);
  Object.keys(severityCounts).forEach((key) => {
    severityPercentages[key] = Math.round((severityCounts[key] / safeZoneTotal) * 100);
  });

  const avgScore = Math.round(
    activeZones.reduce((sum, zone) => sum + zone.score, 0) / safeZoneTotal,
  );

  return {
    openCount,
    closedCount,
    totalRequests,
    cityPulse: openPct,
    openPct,
    closedPct,
    severityCounts,
    severityPercentages,
    zoneTotal,
    avgScore,
  };
}

function buildInsights(records) {
  const grouped = new Map();
  const typeCounts = new Map();
  let openCount = 0;
  let closedCount = 0;

  records.forEach((item) => {
    const type = normalizeText(item.sr_type) || 'Unknown';
    typeCounts.set(type, (typeCounts.get(type) || 0) + 1);

    const status = normalizeText(item.status).toLowerCase();
    const isOpen = ['open', 'in progress', 'pending'].includes(status);
    if (isOpen) openCount += 1;
    else closedCount += 1;

    const zoneKey = normalizeText(item.community_area) || normalizeText(item.ward) || normalizeText(item.zip_code) || normalizeText(item.police_district) || 'Unknown';
    const zoneName = normalizeText(item.community_area)
      ? `Community Area ${item.community_area}`
      : normalizeText(item.ward)
        ? `Ward ${item.ward}`
        : normalizeText(item.zip_code)
          ? `ZIP ${item.zip_code}`
          : `Area ${zoneKey}`;

    if (!grouped.has(zoneKey)) {
      grouped.set(zoneKey, {
        id: zoneKey,
        name: zoneName,
        complaints: 0,
        open: 0,
        recent: 0,
        previous: 0,
        types: new Map(),
        departments: new Map(),
      });
    }

    const bucket = grouped.get(zoneKey);
    bucket.complaints += 1;
    bucket.open += isOpen ? 1 : 0;

    const created = parseDate(item.created_date);
    if (created) {
      const ageHours = (Date.now() - created.getTime()) / 3600000;
      if (ageHours <= 6) bucket.recent += 1;
      if (ageHours <= 24 && ageHours > 6) bucket.previous += 1;
    }

    bucket.types.set(type, (bucket.types.get(type) || 0) + 1);
    const department = normalizeText(item.owner_department) || 'City Services';
    bucket.departments.set(department, (bucket.departments.get(department) || 0) + 1);
  });

  const zones = Array.from(grouped.values())
    .map((zone) => {
      const growth = zone.previous === 0 ? (zone.recent > 0 ? 80 : 0) : Math.round(((zone.recent - zone.previous) / zone.previous) * 100);
      const unresolvedRatio = Math.round((zone.open / Math.max(zone.complaints, 1)) * 100);
      const score = Math.min(100, Math.round(zone.complaints * 0.28 + Math.max(growth, 0) * 0.8 + unresolvedRatio * 0.55));
      const topType = [...zone.types.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'complaints';
      const topDepartment = [...zone.departments.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'City Services';
      return {
        ...zone,
        growth: Math.max(0, growth),
        unresolved: unresolvedRatio,
        score,
        severity: getSeverity(score),
        topType,
        topDepartment,
        summary: `${topType} is the dominant issue shaping this area right now.`,
      };
    })
    .sort((a, b) => b.score - a.score);

  const topIncident = [...typeCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  return {
    zones,
    openCount,
    closedCount,
    topIncident,
    cityPulse: Math.round((openCount / Math.max(records.length, 1)) * 100),
  };
}

function App() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState('Ask about a neighborhood, issue, or department and CivicPulse will explain the signal.');
  const [tasks, setTasks] = useState([]);
  const [taskMessage, setTaskMessage] = useState('');
  const [resolvedZones, setResolvedZones] = useState({});
  const [zoneOverrides, setZoneOverrides] = useState({});
  const [reopenQueue, setReopenQueue] = useState({});
  const [liveTick, setLiveTick] = useState(0);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [lastFixedZone, setLastFixedZone] = useState('');

  const insights = useMemo(() => buildInsights(Array.isArray(complaintData) ? complaintData : []), []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLiveTick((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (Object.keys(reopenQueue).length === 0) return;

    const now = Date.now();
    const dueZones = Object.entries(reopenQueue).filter(([, reopenAt]) => now >= reopenAt);
    if (dueZones.length === 0) return;

    setResolvedZones((prev) => {
      const next = { ...prev };
      dueZones.forEach(([zoneId]) => delete next[zoneId]);
      return next;
    });

    setReopenQueue((prev) => {
      const next = { ...prev };
      dueZones.forEach(([zoneId]) => delete next[zoneId]);
      return next;
    });

    dueZones.forEach(([zoneId]) => {
      const baseZone = insights.zones.find((zone) => zone.id === zoneId);
      if (!baseZone) return;

      const requestCount = 2 + Math.floor(Math.random() * 4);
      const openCount = Math.min(requestCount, 2 + Math.floor(Math.random() * 2));
      const unresolved = Math.min(100, Math.round((openCount / requestCount) * 100));
      const growth = 8 + Math.floor(Math.random() * 12);
      const score = Math.min(100, Math.round(requestCount * 10 + growth * 0.8));

      setZoneOverrides((prev) => ({
        ...prev,
        [zoneId]: {
          complaints: requestCount,
          open: openCount,
          unresolved,
          growth,
          score,
          severity: getSeverity(score),
          summary: `${baseZone.topType} resurfaced in this area after the cleanup window.`,
        },
      }));
    });
  }, [insights.zones, liveTick, reopenQueue]);

  useEffect(() => {
    const metrics = buildZoneMetrics(insights.zones, {}, {});
    setScoreHistory([computeRiskTrend(insights, metrics)]);
  }, [insights]);

  useEffect(() => {
    if (liveTick === 0) return;

    let tickResult = null;
    setZoneOverrides((prev) => {
      tickResult = applyRandomLiveUpdate(insights, resolvedZones, prev);
      return tickResult.nextOverrides;
    });

    if (tickResult) {
      setScoreHistory((history) => [...history, tickResult.riskTrend].slice(-20));
      if (tickResult.message) {
        setLastFixedZone(tickResult.message);
      }
    }
  }, [liveTick, insights, resolvedZones]);

  const zoneMetrics = useMemo(
    () => buildZoneMetrics(insights.zones, zoneOverrides, resolvedZones),
    [insights.zones, resolvedZones, zoneOverrides],
  );

  const sortedAllZones = useMemo(() => (
    [...zoneMetrics]
      .sort((a, b) => b.score - a.score || b.complaints - a.complaints)
  ), [zoneMetrics]);

  const sortedTopTen = useMemo(() => (
    sortedAllZones
      .filter((zone) => !resolvedZones[zone.id] && zone.complaints > 0)
      .slice(0, 10)
  ), [sortedAllZones, resolvedZones]);

  const filteredZones = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    return sortedAllZones.filter((zone) => {
      const matchesText = !normalizedQuery || zone.name.toLowerCase().includes(normalizedQuery) || zone.topType.toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === 'all'
        ? true
        : statusFilter === 'critical'
          ? zone.severity === 'critical'
          : statusFilter === 'open'
            ? zone.unresolved >= 50
            : statusFilter === 'watch'
              ? zone.severity === 'warning' || zone.severity === 'high'
              : true;
      return matchesText && matchesStatus;
    });
  }, [sortedAllZones, query, statusFilter]);

  const liveCityStats = useMemo(
    () => computeCityHealth(insights, zoneMetrics),
    [insights, zoneMetrics],
  );

  useEffect(() => {
    if (!selectedZoneId && sortedTopTen[0]) {
      setSelectedZoneId(sortedTopTen[0].id);
      return;
    }

    if (selectedZoneId && resolvedZones[selectedZoneId] && sortedTopTen[0]) {
      setSelectedZoneId(sortedTopTen[0].id);
    }
  }, [sortedTopTen, selectedZoneId, resolvedZones]);

  const selected = sortedTopTen.find((zone) => zone.id === selectedZoneId)
    || filteredZones.find((zone) => zone.id === selectedZoneId && !resolvedZones[zone.id])
    || sortedTopTen[0]
    || filteredZones.find((zone) => !resolvedZones[zone.id])
    || null;
  const topZone = sortedTopTen[0] || null;

  const handlePulseCheck = (event) => {
    event.preventDefault();
    const input = chatInput.trim();
    const requestedZone = input ? findZoneByArea(input, zoneMetrics) : null;
    if (requestedZone) {
      setSelectedZoneId(requestedZone.id);
    }

    const activeZone = requestedZone || selected;
    const zoneName = activeZone?.name || 'the city';
    const issue = activeZone?.topType || 'service demand';
    const backlog = activeZone?.unresolved || 0;
    const growth = activeZone?.growth || 0;
    const score = activeZone?.score || 0;

    if (!activeZone) {
      setChatResponse('No zone is selected right now. Pick a priority zone to inspect it.');
      return;
    }

    if (resolvedZones[activeZone.id]) {
      setChatResponse(`${zoneName} has already been cleared. The area now shows no active problem and the board has been updated.`);
      return;
    }

    if (!input) {
      setChatResponse(`${zoneName} is currently ranked with a risk score of ${score} because it shows ${backlog}% unresolved demand and a ${growth}% growth signal in ${issue.toLowerCase()}.`);
      return;
    }

    const normalized = input.toLowerCase();
    const rank = sortedTopTen.findIndex((zone) => zone.id === activeZone.id) + 1;
    const cityAvg = liveCityStats.avgScore;

    if (normalized.includes('compare')) {
      const nextZone = sortedTopTen.find((zone) => zone.id !== activeZone.id && zone.score > 0);
      setChatResponse(`${zoneName} is ranked #${rank} with a ${score} risk score. It is ${score >= cityAvg ? 'above' : 'near'} the city average, while ${nextZone?.name || 'the next area'} is the closest comparable hotspot.`);
      return;
    }

    if (normalized.includes('action') || normalized.includes('next')) {
      setChatResponse(`Recommended next step: dispatch a response crew to ${zoneName} to focus on ${issue.toLowerCase()} and clear the ${backlog}% open backlog.`);
      return;
    }

    if (normalized.includes('why') || normalized.includes('rank')) {
      setChatResponse(`${zoneName} ranks high because it shows ${backlog}% unresolved demand, a ${growth}% surge in ${issue.toLowerCase()}, and a current risk score of ${score}.`);
      return;
    }

    if (normalized.includes('department')) {
      setChatResponse(`The most relevant department for ${zoneName} is ${activeZone?.topDepartment || 'city operations'}, especially for ${issue.toLowerCase()} follow-up.`);
      return;
    }

    setChatResponse(`You asked about ${zoneName}. It is currently seeing concentrated pressure in ${issue.toLowerCase()} with a ${growth}% spike and ${backlog}% unresolved demand.`);
  };

  const handleAssignTask = () => {
    if (!selected) {
      setTaskMessage('Choose a zone before assigning a task.');
      return;
    }

    const assignedZone = selected;
    const nextZone = sortedAllZones
      .filter((zone) => zone.id !== assignedZone.id && !resolvedZones[zone.id])
      .slice(0, 10)[0] || null;

    const newTask = {
      id: Date.now(),
      zone: assignedZone.name,
      issue: assignedZone.topType,
      createdAt: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    };

    setResolvedZones((prev) => ({ ...prev, [assignedZone.id]: true }));
    setZoneOverrides((prev) => ({
      ...prev,
      [assignedZone.id]: {
        complaints: 0,
        open: 0,
        unresolved: 0,
        growth: 0,
        score: 0,
        severity: 'stable',
        summary: 'This area has been cleared and no active problem remains.',
      },
    }));
    setReopenQueue((prev) => ({ ...prev, [assignedZone.id]: Date.now() + 5000 }));
    setTasks((prev) => [newTask, ...prev].slice(0, 4));

    if (nextZone) {
      setSelectedZoneId(nextZone.id);
      setLastFixedZone(`Top 10 updated — now focusing on ${nextZone.name}.`);
      setTaskMessage(`Cleared ${assignedZone.name}. Next priority from top 10: ${nextZone.name}.`);
      setChatResponse(`${assignedZone.name} task assigned. Recommended action moved to ${nextZone.name} (score ${nextZone.score}).`);
    } else {
      setTaskMessage(`Assigned a rapid-response task for ${assignedZone.name}. Waiting for the next hotspot.`);
      setChatResponse(`${assignedZone.name} has been cleared. The board will refresh when new requests arrive.`);
    }
  };

  const handleExportReport = () => {
    const content = [
      'CivicPulse report',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'All areas:',
      ...sortedAllZones.map((zone, index) => `${index + 1}. ${zone.name}: ${zone.complaints} requests, score ${zone.score}, ${zone.unresolved}% unresolved, ${zone.topType}`),
      '',
      selected ? `Selected zone: ${selected.name}` : 'No selected zone',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'civicpulse-report.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">CivicPulse • City Operations Intelligence</p>
          <h1>Priority zones for today</h1>
          <p className="subtext">A glowing, data-driven view of Chicago service requests powered by the local complaint file.</p>
        </div>
        <button className="ghost-btn" onClick={handleExportReport}>Export report</button>
      </header>

      <div className="hero-stats">
        <div className="hero-pill"><strong>{liveCityStats.cityPulse}%</strong><span>Open demand signal</span></div>
        <div className="hero-pill"><strong>{liveCityStats.openCount}</strong><span>Still active</span></div>
        <div className="hero-pill"><strong>{liveCityStats.avgScore}</strong><span>Avg risk score</span></div>
      </div>

      <main className="grid">
        <section className="card leaderboard">
          <div className="card-title-row">
            <h2>Top 10 priority zones</h2>
            <span className="pill">Live risk</span>
          </div>

          <ol className="leaderboard-list">
            {sortedTopTen.map((zone, index) => (
              <li
                key={zone.id}
                className={`leaderboard-item ${selected?.id === zone.id ? 'active' : ''}`}
                onClick={() => setSelectedZoneId(zone.id)}
              >
                <div className="item-rank">#{index + 1}</div>
                <div className="item-main">
                  <strong>{zone.name}</strong>
                  <span>{zone.complaints} requests • {zone.topType}</span>
                </div>
                <div className="item-score-wrap">
                  <div className="item-score">{zone.score}</div>
                  <span className={`severity-dot severity-${zone.severity}`} />
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="card summary">
          <div className="card-title-row">
            <p className="eyebrow">AI executive summary</p>
            <span className="pill">Live list</span>
          </div>
          {filteredZones.length > 0 ? (
            <>
              <p className="summary-intro">
                All {sortedAllZones.length} tracked areas — search and filter below. One random area updates every 1 second (+1–5%).
              </p>
              <div className="filter-row">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search a zone or issue..."
                />
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="all">All areas</option>
                  <option value="critical">Critical only</option>
                  <option value="open">High backlog</option>
                  <option value="watch">Watchlist</option>
                </select>
              </div>
              <ul className="summary-list">
                {filteredZones.map((zone, index) => (
                  <li
                    key={zone.id}
                    className={selected?.id === zone.id ? 'active' : ''}
                    onClick={() => setSelectedZoneId(zone.id)}
                  >
                    <div className="summary-rank">#{index + 1}</div>
                    <div className="summary-main">
                      <strong>{zone.name}</strong>
                      <span>{zone.topType}</span>
                    </div>
                    <div className="summary-metrics">
                      <span className="summary-requests">{zone.complaints} requests</span>
                      <span className="summary-score">Score {zone.score}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>No matching zones found. Try another search.</p>
          )}
        </section>

        <section className="card health">
          <div className="card-title-row">
            <p className="eyebrow">City health</p>
            <span className="pill">Bar + donut + line</span>
          </div>
          <CityHealthChart
            severityCounts={liveCityStats.severityCounts}
            severityPercentages={liveCityStats.severityPercentages}
            zoneTotal={liveCityStats.zoneTotal}
            openCount={liveCityStats.openCount}
            closedCount={liveCityStats.closedCount}
            openPct={liveCityStats.openPct}
            closedPct={liveCityStats.closedPct}
            scoreHistory={scoreHistory}
          />
          <p className="health-caption">
            {lastFixedZone || (topZone
              ? `${topZone.name} leads with score ${topZone.score} and ${topZone.unresolved}% unresolved.`
              : 'Tracking citywide service pressure from the live dataset.')}
          </p>
        </section>

        <section className="card charts">
          <div className="card-title-row">
            <h2>Zone evidence</h2>
            {selected ? (
              <span className="pill" style={{ background: severityStyles[selected.severity].color }}>
                {severityStyles[selected.severity].label}
              </span>
            ) : null}
          </div>
          {selected ? (
            <div className="mini-grid">
              <div className="mini-card">
                <p>Volume</p>
                <strong>{selected.complaints}</strong>
                <span>service requests</span>
              </div>
              <div className="mini-card">
                <p>Growth</p>
                <strong>{selected.growth > 0 ? `+${selected.growth}%` : `${selected.growth}%`}</strong>
                <span>recent surge</span>
              </div>
              <div className="mini-card">
                <p>Resolution</p>
                <strong>{selected.unresolved}%</strong>
                <span>still active</span>
              </div>
            </div>
          ) : (
            <div className="status">No live zone data yet.</div>
          )}
        </section>

        <section className="card action">
          <p className="eyebrow">Recommended action</p>
          <h3>{selected ? `Route a targeted response team to ${selected.name} for fast follow-up.` : 'Awaiting live recommendations.'}</h3>
          <button className="primary-btn" onClick={handleAssignTask}>Assign task</button>
          <div className="action-footnote">Suggested focus: {selected?.topDepartment || 'City operations'}</div>
          {taskMessage ? <div className="task-message">{taskMessage}</div> : null}

          <div className="action-top-block">
            <div className="action-top-header">
              <strong>Top 10 priority areas</strong>
              <span>{lastFixedZone || `Live • update ${liveTick}s`}</span>
            </div>
            <ul className="action-top-list" key={`top10-${sortedTopTen.map((zone) => `${zone.id}-${zone.score}`).join('|')}`}>
              {sortedTopTen.map((zone, index) => (
                <li
                  key={`${zone.id}-${zone.score}-${zone.complaints}`}
                  className={selected?.id === zone.id ? 'active' : ''}
                  onClick={() => setSelectedZoneId(zone.id)}
                >
                  <div className="action-top-rank">#{index + 1}</div>
                  <div className="action-top-main">
                    <strong>{zone.name}</strong>
                    <span>{zone.topType} • {zone.unresolved}% open</span>
                  </div>
                  <div className="action-top-metrics">
                    <span>{zone.complaints} req</span>
                    <span className="action-top-score">{zone.score}</span>
                    <span className={`severity-dot severity-${zone.severity}`} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {tasks.length > 0 ? (
            <ul className="task-list">
              {tasks.map((task) => (
                <li key={task.id}>
                  <strong>{task.zone}</strong>
                  <span>{task.issue} • {task.createdAt}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="card chat">
          <p className="eyebrow">AI pulse-check</p>
          <form className="chat-form" onSubmit={handlePulseCheck}>
            <input
              type="text"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Ask about a neighborhood or compare zones..."
            />
            <button type="submit" className="primary-btn">Ask</button>
          </form>
          <div className="chat-response">
            {chatResponse}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
