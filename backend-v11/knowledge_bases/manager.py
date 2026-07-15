"""
Knowledge Base Manager
管理8个知识库的统一接口
"""

from .psych_psychoeducation import PsychPsychoeducation
from .psych_techniques import PsychTechniques
from .psych_mechanisms import PsychMechanisms
from .crisis_referral import CrisisReferral
from .culture_traits import CultureTraits
from .case_events import CaseEvents
from .intervention_tips import InterventionTips
from .medical_resources import MedicalResources


class KnowledgeBaseManager:
    def __init__(self):
        self.psychoeducation = PsychPsychoeducation()
        self.techniques = PsychTechniques()
        self.mechanisms = PsychMechanisms()
        self.crisis = CrisisReferral()
        self.culture = CultureTraits()
        self.cases = CaseEvents()
        self.interventions = InterventionTips()
        self.medical = MedicalResources()

    def query(self, kb_name, query_text, culture_tag=None):
        """Query a specific knowledge base"""
        kb_map = {
            'psychoeducation': self.psychoeducation,
            'techniques': self.techniques,
            'mechanisms': self.mechanisms,
            'crisis': self.crisis,
            'culture': self.culture,
            'cases': self.cases,
            'interventions': self.interventions,
            'medical': self.medical,
        }
        kb = kb_map.get(kb_name)
        if not kb:
            return []
        return kb.search(query_text, culture_tag)

    def get_relevant_knowledge(self, context, culture_tag=None):
        """Get all relevant knowledge for a context"""
        results = {}
        for name, kb in [
            ('psychoeducation', self.psychoeducation),
            ('techniques', self.techniques),
            ('mechanisms', self.mechanisms),
            ('culture', self.culture),
        ]:
            hits = kb.search(context, culture_tag)
            if hits:
                results[name] = hits
        return results
