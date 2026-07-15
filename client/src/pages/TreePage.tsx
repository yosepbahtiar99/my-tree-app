import { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { api } from '../lib/api';
import PersonDetailModal from '../components/PersonDetailModal';
import PersonNode from '../components/PersonNode';

const nodeTypes = { person: PersonNode };

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 200;
const nodeHeight = 150;

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    const isMarriage = node.id.startsWith('marriage-');
    dagreGraph.setNode(node.id, { 
      width: isMarriage ? 1 : nodeWidth, 
      height: isMarriage ? 1 : nodeHeight 
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - (node.id.startsWith('marriage-') ? 1 : nodeWidth) / 2,
        y: nodeWithPosition.y - (node.id.startsWith('marriage-') ? 1 : nodeHeight) / 2,
      },
    };
  });

  return { nodes: newNodes, edges };
};

export default function TreePage() {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [rawPersons, setRawPersons] = useState<any[]>([]);

  const fetchTree = useCallback(async () => {
    try {
      const res = await api.get('/persons/tree');
      const { persons, marriages } = res.data;

      // Urutkan berdasarkan tanggal lahir (yang tertua di kiri/awal)
      const sortedPersons = [...persons].sort((a, b) => {
        if (!a.birthDate) return 1;
        if (!b.birthDate) return -1;
        return new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime();
      });

      setRawPersons(sortedPersons);

      const initialNodes: any[] = sortedPersons.map((p: any) => ({
        id: p.id.toString(),
        type: 'person',
        position: { x: 0, y: 0 },
        data: p,
      }));

      const initialEdges: any[] = [];
      const marriageMap = new Map<string, any>(); 

      const getMarriageKey = (hId: string, wId: string) => `marriage-${[hId, wId].sort().join('-')}`;

      // 1. Tambahkan Pernikahan Resmi dari Database
      if (marriages && marriages.length > 0) {
        marriages.forEach((m: any) => {
          if (m.husbandId && m.wifeId) {
            const key = getMarriageKey(m.husbandId, m.wifeId);
            marriageMap.set(key, { husbandId: m.husbandId, wifeId: m.wifeId });
          }
        });
      }

      // 2. Tambahkan Pernikahan "Tersirat" dari data Anak (jika belum ada)
      sortedPersons.forEach((person: any) => {
        if (person.fatherId && person.motherId) {
          const key = getMarriageKey(person.fatherId, person.motherId);
          if (!marriageMap.has(key)) {
            marriageMap.set(key, { husbandId: person.fatherId, wifeId: person.motherId });
          }
        }
      });

      // 3. Buat Titik Nikah Transparan & Hubungkan Ayah/Ibu ke Titik Nikah
      marriageMap.forEach((m, key) => {
        initialNodes.push({
          id: key,
          position: { x: 0, y: 0 },
          data: { label: '' },
          style: { width: 1, height: 1, background: 'transparent', border: 'none', padding: 0, minWidth: 1 },
        });

        // Garis Ayah ke Titik Nikah (Bottom -> Top)
        initialEdges.push({
          id: `e${m.husbandId}-${key}`,
          source: m.husbandId.toString(),
          target: key,
          sourceHandle: 'bottom',
          type: 'step',
          animated: false,
          style: { stroke: '#94a3b8', strokeWidth: 2 }
        });

        // Garis Ibu ke Titik Nikah (Bottom -> Top)
        initialEdges.push({
          id: `e${m.wifeId}-${key}`,
          source: m.wifeId.toString(),
          target: key,
          sourceHandle: 'bottom',
          type: 'step',
          animated: false,
          style: { stroke: '#94a3b8', strokeWidth: 2 }
        });
      });

      // 4. Hubungkan Anak ke Titik Nikah atau ke Orangtua Tunggal
      sortedPersons.forEach((person: any) => {
        if (person.fatherId && person.motherId) {
          const key = getMarriageKey(person.fatherId, person.motherId);
          initialEdges.push({
            id: `e${key}-${person.id}`,
            source: key,
            target: person.id.toString(),
            targetHandle: 'top',
            type: 'step',
            animated: false,
            style: { stroke: '#94a3b8', strokeWidth: 2 }
          });
        } else if (person.fatherId) {
          initialEdges.push({
            id: `e${person.fatherId}-${person.id}`,
            source: person.fatherId.toString(),
            target: person.id.toString(),
            sourceHandle: 'bottom',
            targetHandle: 'top',
            type: 'step',
            animated: false,
            style: { stroke: '#94a3b8', strokeWidth: 2 }
          });
        } else if (person.motherId) {
          initialEdges.push({
            id: `e${person.motherId}-${person.id}`,
            source: person.motherId.toString(),
            target: person.id.toString(),
            sourceHandle: 'bottom',
            targetHandle: 'top',
            type: 'step',
            animated: false,
            style: { stroke: '#94a3b8', strokeWidth: 2 }
          });
        }
      });

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        initialNodes,
        initialEdges
      );

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } catch (error) {
      console.error('Failed to fetch tree data', error);
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  if (loading) return <div className="p-10 text-center">Memuat Silsilah...</div>;

  const handleNodeClick = (_: React.MouseEvent, node: any) => {
    if (node.type === 'person') {
      const personData = rawPersons.find(p => p.id.toString() === node.id);
      if (personData) {
        setSelectedPerson(personData);
      }
    }
  };

  return (
    <div className="w-full h-[calc(100vh-64px)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background gap={12} size={1} />
      </ReactFlow>
      
      <PersonDetailModal 
        isOpen={!!selectedPerson} 
        onClose={() => setSelectedPerson(null)} 
        person={selectedPerson} 
      />
    </div>
  );
}
