/**
 * Advanced Message Bus Tests
 * Comprehensive test suite for the AdvancedMessageBus component
 * Testing sophisticated communication protocols, negotiations, consensus, and priority messaging
 */

import { AdvancedMessageBus, Message, PriorityMessage, AgentGroup, BroadcastResult, Negotiation, NegotiationResult, ConsensusTopic, ConsensusResult, Proposal, VoteResult, SendResult } from '../../src/communication/AdvancedMessageBus';
import { LLMProvider } from '../../src/utils/llm/SimpleLLMProvider';

// Mock LLM Provider for testing
class MockLLMProvider implements LLMProvider {
  async generateResponse(prompt: string): Promise<string> {
    if (prompt.includes('negotiation facilitation')) {
      return JSON.stringify({
        negotiation_strategy: 'collaborative_bargaining',
        facilitation_approach: 'structured_dialogue',
        success_factors: ['mutual_understanding', 'win_win_solutions'],
        recommended_steps: ['position_clarification', 'interest_exploration', 'option_generation']
      });
    }
    if (prompt.includes('consensus building')) {
      return JSON.stringify({
        consensus_strategy: 'deliberative_democracy',
        facilitation_methods: ['structured_discussion', 'preference_aggregation'],
        convergence_indicators: ['opinion_alignment', 'preference_stability'],
        decision_criteria: ['majority_support', 'minority_protection']
      });
    }
    if (prompt.includes('conflict resolution')) {
      return JSON.stringify({
        resolution_approach: 'mediation',
        intervention_strategies: ['active_listening', 'reframing', 'option_generation'],
        success_metrics: ['participant_satisfaction', 'agreement_durability']
      });
    }
    return JSON.stringify({ analysis: 'mock_response' });
  }

  async chat(messages: any[]): Promise<string> {
    return 'Mock chat response';
  }
}

describe('AdvancedMessageBus', () => {
  let messageBus: AdvancedMessageBus;
  let mockLLMProvider: MockLLMProvider;

  beforeEach(() => {
    mockLLMProvider = new MockLLMProvider();
    messageBus = new AdvancedMessageBus(mockLLMProvider, {
      max_message_queue_size: 10000,
      message_timeout_seconds: 300,
      max_retry_attempts: 3,
      priority_queue_enabled: true,
      consensus_timeout_minutes: 30,
      negotiation_timeout_minutes: 60,
      broadcast_batch_size: 100,
      encryption_enabled: true,
      compression_enabled: true,
      quality_of_service_enabled: true
    });
  });

  describe('Priority Messaging', () => {
    test('should send priority messages with proper handling', async () => {
      const priorityMessage: PriorityMessage = {
        message_id: 'priority-msg-001',
        timestamp: new Date(),
        sender: 'stellar-orchestra',
        recipients: ['atlas-001', 'edison-001'],
        message_type: 'priority',
        priority_level: 9,
        urgency: 'critical',
        subject: 'Critical System Alert',
        content: {
          alert_type: 'resource_shortage',
          affected_systems: ['task_allocation', 'collaboration_engine'],
          immediate_actions_required: ['reduce_workload', 'prioritize_critical_tasks'],
          escalation_required: true,
          contact_info: 'admin@vegapunk.ai'
        },
        metadata: {
          content_type: 'json',
          encoding: 'utf8',
          tags: ['critical', 'system_alert', 'immediate_action'],
          custom_headers: {
            'Alert-Level': 'Critical',
            'Response-Required': 'Immediate'
          }
        },
        delivery_options: {
          delivery_mode: 'immediate',
          priority_level: 9,
          expiration_time: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
          retry_policy: {
            max_retries: 5,
            retry_intervals: [1000, 2000, 4000, 8000, 16000],
            backoff_strategy: 'exponential',
            retry_conditions: ['network_error', 'agent_unavailable'],
            failure_escalation: {
              escalation_threshold: 3,
              escalation_targets: ['system_admin', 'emergency_contact'],
              escalation_actions: ['email_notification', 'sms_alert'],
              notification_methods: ['email', 'webhook', 'dashboard_alert']
            }
          },
          acknowledgment_required: true,
          read_receipt_required: true,
          delivery_confirmation: true,
          routing_preferences: {
            preferred_paths: ['direct', 'high_priority_channel'],
            avoid_paths: ['bulk_channel', 'low_priority_queue'],
            quality_requirements: [
              {
                metric: 'latency',
                threshold: 1000, // 1 second
                importance: 'critical'
              },
              {
                metric: 'reliability',
                threshold: 0.99,
                importance: 'critical'
              }
            ],
            load_balancing: false,
            geographic_preferences: ['primary_datacenter']
          }
        },
        security_requirements: {
          encryption_level: 'advanced',
          authentication_required: true,
          authorization_levels: ['system_admin', 'agent_operator'],
          integrity_check: true,
          non_repudiation: true,
          anonymization: false,
          access_controls: [
            {
              permission_type: 'read',
              allowed_entities: ['atlas-001', 'edison-001', 'system_admin'],
              denied_entities: [],
              conditions: ['authenticated', 'authorized'],
              time_restrictions: []
            }
          ]
        },
        escalation_triggers: [
          {
            condition: 'no_acknowledgment_after_5_minutes',
            escalation_level: 'manager',
            escalation_actions: ['supervisor_notification', 'alternative_contact']
          }
        ]
      };

      const sendResult = await messageBus.sendPriorityMessage(priorityMessage);

      expect(sendResult).toBeDefined();
      expect(sendResult.message_id).toBe(priorityMessage.message_id);
      expect(sendResult.send_timestamp).toBeDefined();
      expect(sendResult.delivery_status).toBeDefined();
      expect(sendResult.recipient_confirmations).toBeDefined();
      expect(sendResult.routing_information).toBeDefined();
      expect(sendResult.quality_metrics).toBeDefined();
      expect(sendResult.security_validation).toBeDefined();
    });

    test('should handle priority message routing optimization', async () => {
      const criticalMessage = createMockPriorityMessage('critical-routing-test', 10);
      const sendResult = await messageBus.sendPriorityMessage(criticalMessage);

      expect(sendResult.routing_information.selected_path).toBeDefined();
      expect(sendResult.routing_information.routing_optimization).toBeDefined();
      expect(sendResult.routing_information.path_quality_score).toBeGreaterThan(0);
      expect(sendResult.routing_information.estimated_delivery_time).toBeDefined();
    });

    test('should implement priority-based message queuing', async () => {
      const highPriorityMessage = createMockPriorityMessage('high-priority', 8);
      const lowPriorityMessage = createMockPriorityMessage('low-priority', 3);

      const results = await Promise.all([
        messageBus.sendPriorityMessage(lowPriorityMessage),
        messageBus.sendPriorityMessage(highPriorityMessage)
      ]);

      // High priority should be processed first or with better routing
      expect(results[1].priority_handling.queue_position).toBeLessThanOrEqual(
        results[0].priority_handling.queue_position
      );
    });
  });

  describe('Group Broadcasting', () => {
    test('should broadcast messages to agent groups effectively', async () => {
      const agentGroup: AgentGroup = {
        group_id: 'research-team',
        group_name: 'Research Coordination Team',
        group_type: 'functional',
        members: ['atlas-001', 'pythagoras-001', 'edison-001'],
        group_leader: 'atlas-001',
        group_permissions: ['read_research_data', 'coordinate_research_tasks'],
        communication_preferences: {
          preferred_channels: ['direct_message', 'group_channel'],
          notification_settings: {
            immediate_notifications: true,
            summary_notifications: false,
            quiet_hours: {
              enabled: false,
              start_time: '22:00',
              end_time: '08:00'
            }
          },
          message_filtering: {
            priority_threshold: 5,
            topic_filters: ['research', 'coordination', 'ethics'],
            sender_whitelist: ['stellar-orchestra', 'system-admin']
          }
        },
        group_metadata: {
          creation_date: new Date(),
          last_activity: new Date(),
          activity_level: 'high',
          collaboration_score: 0.85
        }
      };

      const broadcastMessage: Message = {
        message_id: 'broadcast-msg-001',
        timestamp: new Date(),
        sender: 'stellar-orchestra',
        recipients: ['@research-team'],
        message_type: 'broadcast',
        subject: 'Research Coordination Update',
        content: {
          update_type: 'coordination_announcement',
          announcement: 'New research collaboration protocol in effect',
          details: {
            protocol_version: '2.1',
            effective_date: new Date(),
            key_changes: ['improved_communication_flow', 'enhanced_quality_assurance'],
            training_required: true,
            deadline_for_compliance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          },
          action_items: [
            {
              item: 'Review new protocol documentation',
              assignee: 'all_members',
              deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
            },
            {
              item: 'Complete protocol training module',
              assignee: 'all_members',
              deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
            }
          ]
        },
        metadata: {
          content_type: 'json',
          encoding: 'utf8',
          tags: ['research', 'coordination', 'protocol_update'],
          custom_headers: {
            'Protocol-Version': '2.1',
            'Training-Required': 'true'
          }
        },
        delivery_options: {
          delivery_mode: 'batch',
          priority_level: 6,
          acknowledgment_required: true,
          read_receipt_required: false,
          delivery_confirmation: true,
          retry_policy: {
            max_retries: 3,
            retry_intervals: [5000, 10000, 20000],
            backoff_strategy: 'linear',
            retry_conditions: ['partial_delivery_failure'],
            failure_escalation: {
              escalation_threshold: 2,
              escalation_targets: ['group_leader'],
              escalation_actions: ['direct_notification'],
              notification_methods: ['direct_message']
            }
          },
          routing_preferences: {
            preferred_paths: ['group_channel'],
            avoid_paths: [],
            quality_requirements: [
              {
                metric: 'throughput',
                threshold: 100,
                importance: 'medium'
              }
            ],
            load_balancing: true,
            geographic_preferences: []
          }
        },
        security_requirements: {
          encryption_level: 'basic',
          authentication_required: true,
          authorization_levels: ['group_member'],
          integrity_check: true,
          non_repudiation: false,
          anonymization: false,
          access_controls: [
            {
              permission_type: 'read',
              allowed_entities: ['@research-team'],
              denied_entities: [],
              conditions: ['group_membership'],
              time_restrictions: []
            }
          ]
        }
      };

      const broadcastResult = await messageBus.broadcastToGroup(agentGroup, broadcastMessage);

      expect(broadcastResult).toBeDefined();
      expect(broadcastResult.broadcast_id).toBeDefined();
      expect(broadcastResult.group_id).toBe(agentGroup.group_id);
      expect(broadcastResult.message_id).toBe(broadcastMessage.message_id);
      expect(broadcastResult.broadcast_timestamp).toBeDefined();
      expect(broadcastResult.delivery_summary).toBeDefined();
      expect(broadcastResult.member_responses).toBeDefined();
      expect(broadcastResult.group_engagement_metrics).toBeDefined();
    });

    test('should handle partial delivery failures in group broadcasts', async () => {
      const agentGroup = createMockAgentGroup('partial-failure-test');
      const message = createMockMessage('partial-failure-broadcast');

      const broadcastResult = await messageBus.broadcastToGroup(agentGroup, message);

      expect(broadcastResult.delivery_summary.successful_deliveries).toBeGreaterThanOrEqual(0);
      expect(broadcastResult.delivery_summary.failed_deliveries).toBeGreaterThanOrEqual(0);
      expect(broadcastResult.delivery_summary.pending_deliveries).toBeGreaterThanOrEqual(0);
      
      if (broadcastResult.delivery_summary.failed_deliveries > 0) {
        expect(broadcastResult.failure_handling).toBeDefined();
        expect(broadcastResult.retry_strategy).toBeDefined();
      }
    });

    test('should optimize broadcasting for large groups', async () => {
      const largeGroup = createMockAgentGroup('large-group-test', 50);
      const message = createMockMessage('large-group-broadcast');

      const broadcastResult = await messageBus.broadcastToGroup(largeGroup, message);

      expect(broadcastResult.performance_metrics).toBeDefined();
      expect(broadcastResult.performance_metrics.total_broadcast_time).toBeGreaterThan(0);
      expect(broadcastResult.performance_metrics.average_delivery_time).toBeGreaterThan(0);
      expect(broadcastResult.optimization_applied).toBeDefined();
    });
  });

  describe('Agent Negotiation', () => {
    test('should facilitate negotiations between agents', async () => {
      const negotiation: Negotiation = {
        negotiation_id: 'resource-negotiation-001',
        participants: ['atlas-001', 'edison-001'],
        negotiation_topic: 'Computational resource allocation for concurrent research projects',
        negotiation_type: 'resource_allocation',
        negotiation_context: {
          background: 'Both agents require high-performance computing resources for time-critical research',
          constraints: ['limited_gpu_availability', 'deadline_pressure', 'quality_requirements'],
          objectives: {
            'atlas-001': 'Complete ethical analysis of AI decision-making systems',
            'edison-001': 'Develop innovative optimization algorithms for neural networks'
          },
          resources_in_dispute: [
            {
              resource_id: 'gpu-cluster-alpha',
              resource_type: 'computational',
              total_capacity: 100,
              current_allocation: {
                'atlas-001': 40,
                'edison-001': 35,
                'system-reserved': 25
              },
              contention_level: 'high'
            }
          ],
          time_constraints: {
            atlas_deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            edison_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            resource_availability_window: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
          }
        },
        initial_positions: [
          {
            participant: 'atlas-001',
            position: {
              desired_allocation: 70,
              minimum_acceptable: 55,
              preferred_timeframe: 'immediate',
              justification: 'Ethical analysis has higher priority due to compliance requirements',
              concessions_willing: ['flexible_scheduling', 'quality_optimization_cooperation']
            }
          },
          {
            participant: 'edison-001',
            position: {
              desired_allocation: 65,
              minimum_acceptable: 50,
              preferred_timeframe: 'within_48_hours',
              justification: 'Innovation project has strategic importance and technical dependencies',
              concessions_willing: ['shared_optimization_insights', 'collaborative_validation']
            }
          }
        ],
        negotiation_parameters: {
          max_rounds: 5,
          round_timeout_minutes: 30,
          facilitation_strategy: 'interest_based_negotiation',
          success_criteria: [
            'mutually_acceptable_allocation',
            'timeline_compatibility',
            'quality_preservation'
          ],
          fallback_mechanisms: [
            'arbitration_by_orchestra',
            'resource_expansion',
            'priority_escalation'
          ]
        },
        communication_rules: {
          structured_rounds: true,
          position_disclosure_required: true,
          interest_exploration_encouraged: true,
          creative_option_generation: true,
          respect_and_professionalism: true
        }
      };

      const negotiationResult = await messageBus.negotiateBetweenAgents(negotiation);

      expect(negotiationResult).toBeDefined();
      expect(negotiationResult.negotiation_id).toBe(negotiation.negotiation_id);
      expect(negotiationResult.completion_timestamp).toBeDefined();
      expect(negotiationResult.outcome_status).toBeDefined();
      expect(negotiationResult.final_agreement).toBeDefined();
      expect(negotiationResult.negotiation_process).toBeDefined();
      expect(negotiationResult.participant_satisfaction).toBeDefined();
      expect(negotiationResult.implementation_plan).toBeDefined();
    });

    test('should handle negotiation deadlocks and provide alternatives', async () => {
      const deadlockNegotiation = createMockNegotiation('deadlock-scenario');
      const result = await messageBus.negotiateBetweenAgents(deadlockNegotiation);

      if (result.outcome_status === 'deadlock') {
        expect(result.deadlock_resolution).toBeDefined();
        expect(result.alternative_solutions).toBeDefined();
        expect(result.escalation_recommendations).toBeDefined();
      }
    });

    test('should track negotiation progress and provide insights', async () => {
      const negotiation = createMockNegotiation('progress-tracking');
      const result = await messageBus.negotiateBetweenAgents(negotiation);

      expect(result.negotiation_process.rounds_completed).toBeGreaterThanOrEqual(0);
      expect(result.negotiation_process.communication_quality).toBeDefined();
      expect(result.negotiation_process.progress_indicators).toBeDefined();
      expect(result.negotiation_analytics).toBeDefined();
    });
  });

  describe('Consensus Building', () => {
    test('should achieve consensus on complex topics', async () => {
      const consensusTopic: ConsensusTopic = {
        topic_id: 'ai-ethics-guidelines-v2',
        topic_name: 'AI Ethics Guidelines Version 2.0',
        topic_description: 'Establishing comprehensive ethical guidelines for AI development and deployment',
        topic_type: 'policy_decision',
        topic_scope: 'system_wide',
        decision_options: [
          {
            option_id: 'conservative-approach',
            option_name: 'Conservative Ethics Framework',
            description: 'Strict ethical controls with extensive oversight mechanisms',
            implications: [
              'Higher development time due to rigorous review processes',
              'Reduced risk of ethical violations',
              'Strong stakeholder trust and compliance'
            ],
            support_rationale: 'Prioritizes safety and ethical compliance above all else',
            implementation_complexity: 'high',
            resource_requirements: ['ethics_review_board', 'compliance_monitoring', 'stakeholder_engagement']
          },
          {
            option_id: 'balanced-approach',
            option_name: 'Balanced Ethics Framework',
            description: 'Moderate ethical controls balanced with innovation requirements',
            implications: [
              'Balanced development timeline',
              'Moderate risk management',
              'Stakeholder acceptance with reasonable constraints'
            ],
            support_rationale: 'Balances ethical responsibility with practical innovation needs',
            implementation_complexity: 'medium',
            resource_requirements: ['ethics_guidelines', 'periodic_review', 'training_programs']
          },
          {
            option_id: 'innovation-focused',
            option_name: 'Innovation-Focused Framework',
            description: 'Flexible ethical guidelines that prioritize rapid innovation',
            implications: [
              'Faster development and deployment cycles',
              'Higher innovation potential with managed risk',
              'Requires strong internal ethical culture'
            ],
            support_rationale: 'Enables competitive advantage through rapid ethical innovation',
            implementation_complexity: 'low',
            resource_requirements: ['ethical_training', 'lightweight_review', 'culture_development']
          }
        ],
        consensus_requirements: {
          minimum_participation: 0.8, // 80% of participants must vote
          consensus_threshold: 0.7, // 70% agreement required
          qualified_majority: false,
          veto_rights: ['ethics_board_representative'],
          deliberation_requirements: {
            minimum_discussion_rounds: 2,
            evidence_presentation_required: true,
            impact_analysis_required: true,
            stakeholder_input_required: true
          }
        },
        timeline: {
          discussion_phase_duration: 7 * 24 * 60 * 60 * 1000, // 7 days
          voting_phase_duration: 3 * 24 * 60 * 60 * 1000, // 3 days
          implementation_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        stakeholder_groups: [
          {
            group_name: 'AI Development Team',
            representatives: ['edison-001', 'pythagoras-001'],
            voting_weight: 0.3,
            expertise_areas: ['technical_feasibility', 'implementation_complexity']
          },
          {
            group_name: 'Ethics Board',
            representatives: ['atlas-001'],
            voting_weight: 0.4,
            expertise_areas: ['ethical_implications', 'stakeholder_impact']
          },
          {
            group_name: 'Innovation Team',
            representatives: ['lilith-001'],
            voting_weight: 0.2,
            expertise_areas: ['creative_solutions', 'alternative_approaches']
          },
          {
            group_name: 'Operations Team',
            representatives: ['york-001'],
            voting_weight: 0.1,
            expertise_areas: ['resource_requirements', 'operational_impact']
          }
        ]
      };

      const participants = ['atlas-001', 'edison-001', 'pythagoras-001', 'lilith-001', 'york-001'];

      const consensusResult = await messageBus.achieveConsensus(consensusTopic, participants);

      expect(consensusResult).toBeDefined();
      expect(consensusResult.topic_id).toBe(consensusTopic.topic_id);
      expect(consensusResult.completion_timestamp).toBeDefined();
      expect(consensusResult.consensus_achieved).toBeDefined();
      expect(consensusResult.final_decision).toBeDefined();
      expect(consensusResult.participation_metrics).toBeDefined();
      expect(consensusResult.deliberation_summary).toBeDefined();
      expect(consensusResult.implementation_plan).toBeDefined();
    });

    test('should handle minority opinions and dissent', async () => {
      const contentousTopic = createMockConsensusTopic('contentious-decision');
      const participants = ['atlas-001', 'edison-001', 'pythagoras-001'];

      const result = await messageBus.achieveConsensus(contentousTopic, participants);

      expect(result.minority_opinions).toBeDefined();
      expect(result.dissent_handling).toBeDefined();
      if (result.minority_opinions.length > 0) {
        expect(result.minority_protection_measures).toBeDefined();
      }
    });

    test('should provide consensus quality metrics', async () => {
      const topic = createMockConsensusTopic('quality-metrics');
      const participants = ['atlas-001', 'edison-001'];

      const result = await messageBus.achieveConsensus(topic, participants);

      expect(result.consensus_quality).toBeDefined();
      expect(result.consensus_quality.agreement_strength).toBeGreaterThanOrEqual(0);
      expect(result.consensus_quality.agreement_strength).toBeLessThanOrEqual(1);
      expect(result.consensus_quality.participation_quality).toBeDefined();
      expect(result.consensus_quality.deliberation_depth).toBeDefined();
    });
  });

  describe('Voting Systems', () => {
    test('should conduct voting on proposals with proper procedures', async () => {
      const proposal: Proposal = {
        proposal_id: 'system-upgrade-proposal-001',
        proposal_name: 'Agent Coordination System Upgrade',
        proposal_description: 'Upgrade the agent coordination infrastructure to support enhanced collaboration',
        proposal_type: 'system_improvement',
        proposer: 'york-001',
        proposal_content: {
          upgrade_scope: 'coordination_infrastructure',
          technical_requirements: [
            'Enhanced message routing capabilities',
            'Improved conflict resolution algorithms',
            'Advanced performance monitoring'
          ],
          expected_benefits: [
            'Improved system efficiency by 25%',
            'Reduced coordination conflicts by 40%',
            'Enhanced scalability for future growth'
          ],
          implementation_timeline: {
            planning_phase: '2 weeks',
            development_phase: '6 weeks',
            testing_phase: '2 weeks',
            deployment_phase: '1 week'
          },
          resource_requirements: {
            development_hours: 400,
            testing_hours: 100,
            infrastructure_costs: 50000,
            training_requirements: '40 hours per agent'
          },
          risk_assessment: {
            technical_risks: ['compatibility_issues', 'performance_degradation'],
            operational_risks: ['temporary_service_disruption', 'learning_curve'],
            mitigation_strategies: ['phased_rollout', 'comprehensive_testing', 'rollback_procedures']
          }
        },
        voting_parameters: {
          voting_method: 'weighted_majority',
          approval_threshold: 0.65, // 65% approval required
          minimum_participation: 0.8, // 80% must vote
          voting_period_days: 5,
          eligible_voters: ['atlas-001', 'edison-001', 'pythagoras-001', 'lilith-001', 'york-001'],
          voter_weights: {
            'atlas-001': 0.2, // Ethics perspective
            'edison-001': 0.25, // Innovation perspective
            'pythagoras-001': 0.25, // Technical perspective
            'lilith-001': 0.15, // Creative perspective
            'york-001': 0.15 // Operational perspective
          },
          ballot_type: 'approval_with_conditions',
          anonymous_voting: false,
          vote_explanation_required: true
        },
        supporting_documents: [
          {
            document_id: 'technical-specification',
            document_name: 'Technical Specification Document',
            document_type: 'technical',
            summary: 'Detailed technical requirements and architecture'
          },
          {
            document_id: 'cost-benefit-analysis',
            document_name: 'Cost-Benefit Analysis',
            document_type: 'financial',
            summary: 'Financial impact and return on investment analysis'
          }
        ]
      };

      const voters = ['atlas-001', 'edison-001', 'pythagoras-001', 'lilith-001', 'york-001'];

      const voteResult = await messageBus.voteOnProposal(proposal, voters);

      expect(voteResult).toBeDefined();
      expect(voteResult.proposal_id).toBe(proposal.proposal_id);
      expect(voteResult.voting_completion_timestamp).toBeDefined();
      expect(voteResult.voting_outcome).toBeDefined();
      expect(voteResult.vote_tally).toBeDefined();
      expect(voteResult.participation_metrics).toBeDefined();
      expect(voteResult.individual_votes).toBeDefined();
      expect(voteResult.proposal_status).toBeDefined();
    });

    test('should handle different voting methods and procedures', async () => {
      const majorityProposal = createMockProposal('majority-vote', 'simple_majority');
      const consensusProposal = createMockProposal('consensus-vote', 'consensus');
      const rankedProposal = createMockProposal('ranked-vote', 'ranked_choice');

      const voters = ['atlas-001', 'edison-001', 'pythagoras-001'];

      const results = await Promise.all([
        messageBus.voteOnProposal(majorityProposal, voters),
        messageBus.voteOnProposal(consensusProposal, voters),
        messageBus.voteOnProposal(rankedProposal, voters)
      ]);

      results.forEach(result => {
        expect(result.voting_method_used).toBeDefined();
        expect(result.threshold_application).toBeDefined();
        expect(result.vote_validity).toBeDefined();
      });
    });

    test('should provide detailed voting analytics', async () => {
      const proposal = createMockProposal('analytics-test', 'weighted_majority');
      const voters = ['atlas-001', 'edison-001', 'pythagoras-001', 'lilith-001'];

      const result = await messageBus.voteOnProposal(proposal, voters);

      expect(result.voting_analytics).toBeDefined();
      expect(result.voting_analytics.participation_analysis).toBeDefined();
      expect(result.voting_analytics.voting_patterns).toBeDefined();
      expect(result.voting_analytics.demographic_breakdown).toBeDefined();
      expect(result.voting_analytics.decision_factors).toBeDefined();
    });
  });

  describe('Performance and Metrics', () => {
    test('should provide comprehensive messaging metrics', async () => {
      const metrics = messageBus.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.total_messages_processed).toBeGreaterThanOrEqual(0);
      expect(metrics.priority_messages_sent).toBeGreaterThanOrEqual(0);
      expect(metrics.broadcasts_completed).toBeGreaterThanOrEqual(0);
      expect(metrics.negotiations_facilitated).toBeGreaterThanOrEqual(0);
      expect(metrics.consensus_processes_completed).toBeGreaterThanOrEqual(0);
      expect(metrics.votes_conducted).toBeGreaterThanOrEqual(0);
      expect(metrics.average_message_delivery_time).toBeGreaterThan(0);
      expect(metrics.system_reliability_score).toBeGreaterThanOrEqual(0);
      expect(metrics.system_reliability_score).toBeLessThanOrEqual(1);
    });

    test('should track communication quality over time', async () => {
      // Send various types of messages
      await messageBus.sendPriorityMessage(createMockPriorityMessage('quality-test-1', 8));
      await messageBus.broadcastToGroup(createMockAgentGroup('quality-test'), createMockMessage('quality-broadcast'));

      const metrics = messageBus.getMetrics();
      expect(metrics.communication_quality_trends).toBeDefined();
      expect(metrics.performance_optimization_insights).toBeDefined();
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle LLM provider failures gracefully', async () => {
      const errorLLMProvider = {
        generateResponse: async () => { throw new Error('LLM unavailable'); },
        chat: async () => { throw new Error('LLM unavailable'); }
      } as LLMProvider;

      const errorMessageBus = new AdvancedMessageBus(errorLLMProvider);
      const message = createMockPriorityMessage('error-test', 5);

      await expect(errorMessageBus.sendPriorityMessage(message))
        .rejects.toThrow('Priority message sending failed');
    });

    test('should handle network failures and retry appropriately', async () => {
      const message = createMockPriorityMessage('retry-test', 7);
      
      // Simulate network issues by using high retry requirements
      message.delivery_options.retry_policy.max_retries = 3;
      message.delivery_options.retry_policy.retry_intervals = [100, 200, 400];

      const result = await messageBus.sendPriorityMessage(message);
      expect(result.retry_information).toBeDefined();
    });

    test('should maintain message integrity during failures', async () => {
      const message = createMockPriorityMessage('integrity-test', 9);
      message.security_requirements.integrity_check = true;

      const result = await messageBus.sendPriorityMessage(message);
      expect(result.security_validation.integrity_verified).toBeTruthy();
    });
  });

  // Helper functions
  function createMockPriorityMessage(id: string, priority: number): PriorityMessage {
    return {
      message_id: id,
      timestamp: new Date(),
      sender: 'test-sender',
      recipients: ['atlas-001'],
      message_type: 'priority',
      priority_level: priority,
      urgency: priority > 7 ? 'critical' : priority > 5 ? 'high' : 'medium',
      subject: `Test priority message: ${id}`,
      content: { test: true, priority },
      metadata: {
        content_type: 'json',
        encoding: 'utf8',
        tags: ['test'],
        custom_headers: {}
      },
      delivery_options: {
        delivery_mode: 'immediate',
        priority_level: priority,
        acknowledgment_required: true,
        read_receipt_required: false,
        delivery_confirmation: true,
        retry_policy: {
          max_retries: 3,
          retry_intervals: [1000, 2000, 4000],
          backoff_strategy: 'exponential',
          retry_conditions: ['network_error'],
          failure_escalation: {
            escalation_threshold: 2,
            escalation_targets: ['admin'],
            escalation_actions: ['notify'],
            notification_methods: ['email']
          }
        },
        routing_preferences: {
          preferred_paths: ['direct'],
          avoid_paths: [],
          quality_requirements: [],
          load_balancing: true,
          geographic_preferences: []
        }
      },
      security_requirements: {
        encryption_level: 'basic',
        authentication_required: true,
        authorization_levels: ['agent'],
        integrity_check: true,
        non_repudiation: false,
        anonymization: false,
        access_controls: []
      },
      escalation_triggers: []
    };
  }

  function createMockAgentGroup(id: string, memberCount: number = 3): AgentGroup {
    const members = Array.from({ length: memberCount }, (_, i) => `agent-${i + 1}`);
    
    return {
      group_id: id,
      group_name: `Test Group: ${id}`,
      group_type: 'functional',
      members: members,
      group_leader: members[0],
      group_permissions: ['basic_communication'],
      communication_preferences: {
        preferred_channels: ['group_channel'],
        notification_settings: {
          immediate_notifications: true,
          summary_notifications: false,
          quiet_hours: { enabled: false, start_time: '22:00', end_time: '08:00' }
        },
        message_filtering: {
          priority_threshold: 3,
          topic_filters: [],
          sender_whitelist: []
        }
      },
      group_metadata: {
        creation_date: new Date(),
        last_activity: new Date(),
        activity_level: 'medium',
        collaboration_score: 0.7
      }
    };
  }

  function createMockMessage(id: string): Message {
    return {
      message_id: id,
      timestamp: new Date(),
      sender: 'test-sender',
      recipients: ['atlas-001'],
      message_type: 'standard',
      subject: `Test message: ${id}`,
      content: { test: true },
      metadata: {
        content_type: 'json',
        encoding: 'utf8',
        tags: ['test'],
        custom_headers: {}
      },
      delivery_options: {
        delivery_mode: 'immediate',
        priority_level: 5,
        acknowledgment_required: false,
        read_receipt_required: false,
        delivery_confirmation: false,
        retry_policy: {
          max_retries: 1,
          retry_intervals: [1000],
          backoff_strategy: 'fixed',
          retry_conditions: [],
          failure_escalation: {
            escalation_threshold: 1,
            escalation_targets: [],
            escalation_actions: [],
            notification_methods: []
          }
        },
        routing_preferences: {
          preferred_paths: [],
          avoid_paths: [],
          quality_requirements: [],
          load_balancing: true,
          geographic_preferences: []
        }
      },
      security_requirements: {
        encryption_level: 'none',
        authentication_required: false,
        authorization_levels: [],
        integrity_check: false,
        non_repudiation: false,
        anonymization: false,
        access_controls: []
      }
    };
  }

  function createMockNegotiation(id: string): Negotiation {
    return {
      negotiation_id: id,
      participants: ['atlas-001', 'edison-001'],
      negotiation_topic: `Test negotiation: ${id}`,
      negotiation_type: 'resource_allocation',
      negotiation_context: {
        background: 'Test negotiation scenario',
        constraints: ['time_limit'],
        objectives: {
          'atlas-001': 'Test objective A',
          'edison-001': 'Test objective B'
        },
        resources_in_dispute: [],
        time_constraints: {
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      },
      initial_positions: [],
      negotiation_parameters: {
        max_rounds: 3,
        round_timeout_minutes: 15,
        facilitation_strategy: 'collaborative',
        success_criteria: ['agreement'],
        fallback_mechanisms: ['arbitration']
      },
      communication_rules: {
        structured_rounds: true,
        position_disclosure_required: false,
        interest_exploration_encouraged: true,
        creative_option_generation: true,
        respect_and_professionalism: true
      }
    };
  }

  function createMockConsensusTopic(id: string): ConsensusTopic {
    return {
      topic_id: id,
      topic_name: `Test consensus topic: ${id}`,
      topic_description: 'Test consensus building scenario',
      topic_type: 'decision',
      topic_scope: 'limited',
      decision_options: [
        {
          option_id: 'option-a',
          option_name: 'Option A',
          description: 'First test option',
          implications: ['test_implication'],
          support_rationale: 'Test rationale',
          implementation_complexity: 'low',
          resource_requirements: []
        }
      ],
      consensus_requirements: {
        minimum_participation: 0.5,
        consensus_threshold: 0.6,
        qualified_majority: false,
        veto_rights: [],
        deliberation_requirements: {
          minimum_discussion_rounds: 1,
          evidence_presentation_required: false,
          impact_analysis_required: false,
          stakeholder_input_required: false
        }
      },
      timeline: {
        discussion_phase_duration: 24 * 60 * 60 * 1000,
        voting_phase_duration: 24 * 60 * 60 * 1000,
        implementation_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      stakeholder_groups: []
    };
  }

  function createMockProposal(id: string, votingMethod: string): Proposal {
    return {
      proposal_id: id,
      proposal_name: `Test proposal: ${id}`,
      proposal_description: 'Test proposal for voting',
      proposal_type: 'test',
      proposer: 'test-proposer',
      proposal_content: {
        summary: 'Test proposal content'
      },
      voting_parameters: {
        voting_method: votingMethod as any,
        approval_threshold: 0.5,
        minimum_participation: 0.5,
        voting_period_days: 1,
        eligible_voters: ['atlas-001', 'edison-001'],
        voter_weights: {},
        ballot_type: 'simple_approval',
        anonymous_voting: false,
        vote_explanation_required: false
      },
      supporting_documents: []
    };
  }
});